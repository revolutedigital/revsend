import { Queue, Worker, Job } from "bullmq";
import { redis } from "@/lib/redis";
import { db } from "@/lib/db";
import { sendMessage, MediaOptions } from "@/lib/whatsapp/client";

interface DispatchJob {
  campaignId: string;
  contactId: string;
  whatsappNumberId: string;
  messageId: string;
  phoneNumber: string;
  message: string;
  media?: {
    type: "image" | "audio" | "video";
    url: string;
  };
}

// Configuração da fila
const queueOptions = {
  connection: redis,
};

// Criar fila de disparo
export const dispatchQueue = new Queue<DispatchJob>("dispatch", queueOptions);

// Função para adicionar jobs à fila com delay
export async function scheduleMessage(
  job: DispatchJob,
  delayMs: number
): Promise<void> {
  await dispatchQueue.add("send-message", job, {
    delay: delayMs,
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  });
}

// Função para iniciar o disparo de uma campanha
export async function startCampaignDispatch(campaignId: string): Promise<void> {
  const campaign = await db.campaign.findUnique({
    where: { id: campaignId },
    include: {
      list: {
        include: {
          contacts: true,
        },
      },
      messages: true,
      campaignNumbers: {
        include: {
          whatsappNumber: true,
        },
      },
    },
  });

  if (!campaign || !campaign.list) {
    throw new Error("Campanha ou lista não encontrada");
  }

  const contacts = campaign.list.contacts;
  const messages = campaign.messages;
  const numbers = campaign.campaignNumbers.filter(
    (cn) => cn.whatsappNumber.status === "connected"
  );

  if (numbers.length === 0) {
    throw new Error("Nenhum WhatsApp conectado");
  }

  if (messages.length === 0) {
    throw new Error("Nenhuma mensagem configurada");
  }

  // Atualizar status da campanha
  await db.campaign.update({
    where: { id: campaignId },
    data: {
      status: "running",
      startedAt: new Date(),
    },
  });

  let currentDelay = 0;
  let messageIndex = 0;
  let numberIndex = 0;

  // Criar jobs para cada contato
  for (const contact of contacts) {
    // Rotação de mensagens
    const message = messages[messageIndex % messages.length];
    messageIndex++;

    // Rotação de números
    const campaignNumber = numbers[numberIndex % numbers.length];
    numberIndex++;

    // Substituir variáveis na mensagem
    let finalMessage = message.content;
    if (contact.name) {
      finalMessage = finalMessage.replace(/{nome}/gi, contact.name);
    }
    if (contact.extraFields) {
      const extras = contact.extraFields as Record<string, string>;
      for (const [key, value] of Object.entries(extras)) {
        finalMessage = finalMessage.replace(
          new RegExp(`{${key}}`, "gi"),
          value
        );
      }
    }

    // Criar registro de mensagem enviada
    const sentMessage = await db.sentMessage.create({
      data: {
        campaignId,
        contactId: contact.id,
        whatsappNumberId: campaignNumber.whatsappNumberId,
        messageId: message.id,
        status: "pending",
      },
    });

    // Preparar mídia se existir
    const mediaData = message.mediaType && message.mediaUrl
      ? {
          type: message.mediaType as "image" | "audio" | "video",
          url: message.mediaUrl,
        }
      : undefined;

    // Agendar envio
    await scheduleMessage(
      {
        campaignId,
        contactId: contact.id,
        whatsappNumberId: campaignNumber.whatsappNumberId,
        messageId: message.id,
        phoneNumber: contact.phoneNumber,
        message: finalMessage,
        media: mediaData,
      },
      currentDelay
    );

    // Calcular próximo delay (aleatório entre min e max)
    const minDelay = campaign.minIntervalSeconds * 1000;
    const maxDelay = campaign.maxIntervalSeconds * 1000;
    currentDelay += Math.floor(Math.random() * (maxDelay - minDelay) + minDelay);
  }
}

// Função para pausar campanha
export async function pauseCampaign(campaignId: string): Promise<void> {
  await db.campaign.update({
    where: { id: campaignId },
    data: { status: "paused" },
  });

  // Remover jobs pendentes da fila
  const jobs = await dispatchQueue.getJobs(["delayed", "waiting"]);
  for (const job of jobs) {
    if (job.data.campaignId === campaignId) {
      await job.remove();
    }
  }
}

// Função para cancelar campanha
export async function cancelCampaign(campaignId: string): Promise<void> {
  await db.campaign.update({
    where: { id: campaignId },
    data: {
      status: "cancelled",
      completedAt: new Date(),
    },
  });

  // Remover jobs pendentes
  const jobs = await dispatchQueue.getJobs(["delayed", "waiting"]);
  for (const job of jobs) {
    if (job.data.campaignId === campaignId) {
      await job.remove();
    }
  }
}

// Worker para processar os jobs
export function createDispatchWorker(): Worker<DispatchJob> {
  return new Worker<DispatchJob>(
    "dispatch",
    async (job: Job<DispatchJob>) => {
      const { campaignId, contactId, whatsappNumberId, messageId, phoneNumber, message, media } =
        job.data;

      // Verificar se a campanha ainda está ativa
      const campaign = await db.campaign.findUnique({
        where: { id: campaignId },
      });

      if (!campaign || campaign.status !== "running") {
        return { skipped: true };
      }

      // Preparar opções de mídia
      const mediaOptions: MediaOptions | undefined = media
        ? { type: media.type, url: media.url }
        : undefined;

      // Enviar mensagem (com ou sem mídia)
      const result = await sendMessage(whatsappNumberId, phoneNumber, message, mediaOptions);

      // Atualizar registro
      const sentMessage = await db.sentMessage.findFirst({
        where: {
          campaignId,
          contactId,
          whatsappNumberId,
          messageId,
        },
      });

      if (sentMessage) {
        await db.sentMessage.update({
          where: { id: sentMessage.id },
          data: {
            status: result.success ? "sent" : "failed",
            sentAt: result.success ? new Date() : null,
            errorMessage: result.error,
          },
        });
      }

      // Atualizar contadores da campanha
      if (result.success) {
        await db.campaign.update({
          where: { id: campaignId },
          data: {
            totalSent: { increment: 1 },
          },
        });

        await db.campaignNumber.updateMany({
          where: {
            campaignId,
            whatsappNumberId,
          },
          data: {
            messagesSent: { increment: 1 },
          },
        });

        await db.campaignMessage.update({
          where: { id: messageId },
          data: {
            timesUsed: { increment: 1 },
          },
        });
      } else {
        await db.campaign.update({
          where: { id: campaignId },
          data: {
            totalFailed: { increment: 1 },
          },
        });
      }

      // Verificar se é a última mensagem
      const pendingCount = await db.sentMessage.count({
        where: {
          campaignId,
          status: "pending",
        },
      });

      if (pendingCount === 0) {
        await db.campaign.update({
          where: { id: campaignId },
          data: {
            status: "completed",
            completedAt: new Date(),
          },
        });
      }

      return result;
    },
    queueOptions
  );
}
