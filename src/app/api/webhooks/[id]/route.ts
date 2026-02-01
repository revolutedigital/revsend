import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { db } from "@/lib/db";

const WEBHOOK_EVENTS = [
  "campaign.started",
  "campaign.completed",
  "campaign.paused",
  "message.sent",
  "message.failed",
  "reply.received",
];

// GET - Buscar webhook específico
export const GET = apiHandler(async (_req: NextRequest, { params, session }) => {
  const webhook = await db.webhook.findFirst({
    where: {
      id: params?.id,
      userId: session!.user.id,
    },
  });

  if (!webhook) {
    return NextResponse.json(
      { error: "Webhook não encontrado" },
      { status: 404 }
    );
  }

  return NextResponse.json({ webhook });
});

// PUT - Atualizar webhook
export const PUT = apiHandler(async (req: NextRequest, { params, session }) => {
  const existing = await db.webhook.findFirst({
    where: {
      id: params?.id,
      userId: session!.user.id,
    },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Webhook não encontrado" },
      { status: 404 }
    );
  }

  const body = await req.json();
  const { name, url, events, isActive } = body;

  // Validar URL se fornecida
  if (url) {
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: "URL inválida" },
        { status: 400 }
      );
    }
  }

  // Validar eventos se fornecidos
  if (events) {
    const invalidEvents = events.filter((e: string) => !WEBHOOK_EVENTS.includes(e));
    if (invalidEvents.length > 0) {
      return NextResponse.json(
        { error: `Eventos inválidos: ${invalidEvents.join(", ")}` },
        { status: 400 }
      );
    }
  }

  const webhook = await db.webhook.update({
    where: { id: params?.id },
    data: {
      name: name ?? existing.name,
      url: url ?? existing.url,
      events: events ?? existing.events,
      isActive: isActive !== undefined ? isActive : existing.isActive,
    },
  });

  return NextResponse.json({ webhook });
});

// DELETE - Excluir webhook
export const DELETE = apiHandler(async (_req: NextRequest, { params, session }) => {
  const existing = await db.webhook.findFirst({
    where: {
      id: params?.id,
      userId: session!.user.id,
    },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Webhook não encontrado" },
      { status: 404 }
    );
  }

  await db.webhook.delete({
    where: { id: params?.id },
  });

  return NextResponse.json({ success: true });
});
