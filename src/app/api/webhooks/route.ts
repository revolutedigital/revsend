import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import crypto from "crypto";

const WEBHOOK_EVENTS = [
  "campaign.started",
  "campaign.completed",
  "campaign.paused",
  "message.sent",
  "message.failed",
  "reply.received",
];

// GET - Listar webhooks do usuário
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const webhooks = await db.webhook.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ webhooks, availableEvents: WEBHOOK_EVENTS });
  } catch (error) {
    console.error("Erro ao buscar webhooks:", error);
    return NextResponse.json(
      { error: "Erro ao buscar webhooks" },
      { status: 500 }
    );
  }
}

// POST - Criar novo webhook
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { name, url, events, generateSecret } = body;

    if (!name || !url || !events?.length) {
      return NextResponse.json(
        { error: "Nome, URL e eventos são obrigatórios" },
        { status: 400 }
      );
    }

    // Validar URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: "URL inválida" },
        { status: 400 }
      );
    }

    // Validar eventos
    const invalidEvents = events.filter((e: string) => !WEBHOOK_EVENTS.includes(e));
    if (invalidEvents.length > 0) {
      return NextResponse.json(
        { error: `Eventos inválidos: ${invalidEvents.join(", ")}` },
        { status: 400 }
      );
    }

    // Limitar quantidade de webhooks
    const count = await db.webhook.count({
      where: { userId: session.user.id },
    });

    if (count >= 10) {
      return NextResponse.json(
        { error: "Limite de 10 webhooks atingido" },
        { status: 400 }
      );
    }

    // Gerar secret se solicitado
    const secret = generateSecret
      ? crypto.randomBytes(32).toString("hex")
      : null;

    const webhook = await db.webhook.create({
      data: {
        userId: session.user.id,
        name,
        url,
        events,
        secret,
      },
    });

    return NextResponse.json({ webhook }, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar webhook:", error);
    return NextResponse.json(
      { error: "Erro ao criar webhook" },
      { status: 500 }
    );
  }
}
