import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import crypto from "crypto";

// POST - Testar webhook
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const webhook = await db.webhook.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!webhook) {
      return NextResponse.json(
        { error: "Webhook não encontrado" },
        { status: 404 }
      );
    }

    // Payload de teste
    const payload = {
      event: "test",
      timestamp: new Date().toISOString(),
      data: {
        message: "Este é um teste do webhook RevSend",
        webhookId: webhook.id,
        webhookName: webhook.name,
      },
    };

    // SSRF protection: block private/internal URLs
    const webhookUrl = new URL(webhook.url);
    const hostname = webhookUrl.hostname.toLowerCase();
    const blockedPatterns = [
      /^localhost$/i,
      /^127\./,
      /^10\./,
      /^172\.(1[6-9]|2\d|3[01])\./,
      /^192\.168\./,
      /^0\./,
      /^169\.254\./,
      /^::1$/,
      /^fc00:/i,
      /^fe80:/i,
      /\.local$/i,
      /\.internal$/i,
    ];
    if (blockedPatterns.some((p) => p.test(hostname))) {
      return NextResponse.json(
        { error: "URL não permitida: endereços internos são bloqueados" },
        { status: 400 }
      );
    }
    if (!["https:", "http:"].includes(webhookUrl.protocol)) {
      return NextResponse.json(
        { error: "Apenas URLs HTTP/HTTPS são permitidas" },
        { status: 400 }
      );
    }

    const payloadString = JSON.stringify(payload);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Webhook-Event": "test",
      "X-Webhook-Timestamp": payload.timestamp,
    };

    // Adicionar assinatura HMAC se houver secret
    if (webhook.secret) {
      const signature = crypto
        .createHmac("sha256", webhook.secret)
        .update(payloadString)
        .digest("hex");
      headers["X-Webhook-Signature"] = `sha256=${signature}`;
    }

    const startTime = Date.now();

    try {
      const response = await fetch(webhook.url, {
        method: "POST",
        headers,
        body: payloadString,
        signal: AbortSignal.timeout(10000),
      });

      const responseTime = Date.now() - startTime;
      const responseBody = await response.text();

      // Atualizar última chamada
      await db.webhook.update({
        where: { id: webhook.id },
        data: {
          lastCalledAt: new Date(),
          lastError: response.ok ? null : `HTTP ${response.status}`,
        },
      });

      return NextResponse.json({
        success: response.ok,
        statusCode: response.status,
        statusText: response.statusText,
        responseTime,
        responseBody: responseBody.substring(0, 1000), // Limitar tamanho
      });
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      // Atualizar erro
      await db.webhook.update({
        where: { id: webhook.id },
        data: {
          lastCalledAt: new Date(),
          lastError: errorMessage,
        },
      });

      return NextResponse.json({
        success: false,
        error: errorMessage,
        responseTime,
      });
    }
  } catch (error) {
    console.error("Erro ao testar webhook:", error);
    return NextResponse.json(
      { error: "Erro ao testar webhook" },
      { status: 500 }
    );
  }
}
