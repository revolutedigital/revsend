import { db } from "@/lib/db";
import crypto from "crypto";

export type WebhookEvent =
  | "campaign.started"
  | "campaign.completed"
  | "campaign.paused"
  | "message.sent"
  | "message.failed"
  | "reply.received";

interface WebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  data: Record<string, unknown>;
}

function generateSignature(payload: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

export async function triggerWebhooks(
  userId: string,
  event: WebhookEvent,
  data: Record<string, unknown>
): Promise<void> {
  try {
    // Buscar webhooks ativos do usuário que escutam este evento
    const webhooks = await db.webhook.findMany({
      where: {
        userId,
        isActive: true,
        events: { has: event },
      },
    });

    if (webhooks.length === 0) return;

    const payload: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      data,
    };

    const payloadString = JSON.stringify(payload);

    // Disparar webhooks em paralelo
    const results = await Promise.allSettled(
      webhooks.map(async (webhook) => {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          "X-Webhook-Event": event,
          "X-Webhook-Timestamp": payload.timestamp,
        };

        // Adicionar assinatura HMAC se houver secret
        if (webhook.secret) {
          const signature = generateSignature(payloadString, webhook.secret);
          headers["X-Webhook-Signature"] = `sha256=${signature}`;
        }

        const response = await fetch(webhook.url, {
          method: "POST",
          headers,
          body: payloadString,
          signal: AbortSignal.timeout(10000), // 10s timeout
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return { webhookId: webhook.id, success: true };
      })
    );

    // Atualizar status dos webhooks
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const webhook = webhooks[i];

      if (result.status === "fulfilled") {
        await db.webhook.update({
          where: { id: webhook.id },
          data: {
            lastCalledAt: new Date(),
            lastError: null,
          },
        });
      } else {
        await db.webhook.update({
          where: { id: webhook.id },
          data: {
            lastCalledAt: new Date(),
            lastError: result.reason?.message || "Unknown error",
          },
        });
      }
    }
  } catch (error) {
    console.error("Erro ao disparar webhooks:", error);
  }
}

// Funções helpers para eventos específicos
export async function onCampaignStarted(
  userId: string,
  campaignId: string,
  campaignName: string,
  totalContacts: number
): Promise<void> {
  await triggerWebhooks(userId, "campaign.started", {
    campaignId,
    campaignName,
    totalContacts,
  });
}

export async function onCampaignCompleted(
  userId: string,
  campaignId: string,
  campaignName: string,
  stats: { sent: number; failed: number; replies: number }
): Promise<void> {
  await triggerWebhooks(userId, "campaign.completed", {
    campaignId,
    campaignName,
    ...stats,
  });
}

export async function onMessageSent(
  userId: string,
  campaignId: string,
  contactId: string,
  phoneNumber: string
): Promise<void> {
  await triggerWebhooks(userId, "message.sent", {
    campaignId,
    contactId,
    phoneNumber,
  });
}

export async function onMessageFailed(
  userId: string,
  campaignId: string,
  contactId: string,
  phoneNumber: string,
  error: string
): Promise<void> {
  await triggerWebhooks(userId, "message.failed", {
    campaignId,
    contactId,
    phoneNumber,
    error,
  });
}

export async function onReplyReceived(
  userId: string,
  campaignId: string,
  contactId: string,
  phoneNumber: string,
  content: string
): Promise<void> {
  await triggerWebhooks(userId, "reply.received", {
    campaignId,
    contactId,
    phoneNumber,
    content,
  });
}
