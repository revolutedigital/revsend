import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
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
export async function GET(
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

    return NextResponse.json({ webhook });
  } catch (error) {
    console.error("Erro ao buscar webhook:", error);
    return NextResponse.json(
      { error: "Erro ao buscar webhook" },
      { status: 500 }
    );
  }
}

// PUT - Atualizar webhook
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const existing = await db.webhook.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Webhook não encontrado" },
        { status: 404 }
      );
    }

    const body = await request.json();
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
      where: { id: params.id },
      data: {
        name: name ?? existing.name,
        url: url ?? existing.url,
        events: events ?? existing.events,
        isActive: isActive !== undefined ? isActive : existing.isActive,
      },
    });

    return NextResponse.json({ webhook });
  } catch (error) {
    console.error("Erro ao atualizar webhook:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar webhook" },
      { status: 500 }
    );
  }
}

// DELETE - Excluir webhook
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const existing = await db.webhook.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Webhook não encontrado" },
        { status: 404 }
      );
    }

    await db.webhook.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao excluir webhook:", error);
    return NextResponse.json(
      { error: "Erro ao excluir webhook" },
      { status: 500 }
    );
  }
}
