import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
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
export const GET = apiHandler(async (_req: NextRequest, { session }) => {
  const webhooks = await db.webhook.findMany({
    where: { organizationId: session!.user.organizationId! },
    orderBy: { createdAt: "desc" },
  });

  const sanitizedWebhooks = webhooks.map(({ secret, ...rest }) => ({
    ...rest,
    hasSecret: !!secret,
  }));

  return NextResponse.json({ webhooks: sanitizedWebhooks, availableEvents: WEBHOOK_EVENTS });
}, { requiredPermission: "webhooks:read" });

// POST - Criar novo webhook
export const POST = apiHandler(async (req: NextRequest, { session }) => {
  const body = await req.json();
  const { name, url, events, generateSecret } = body;

  if (!name || !url || !events?.length) {
    return NextResponse.json(
      { error: "Nome, URL e eventos são obrigatórios" },
      { status: 400 }
    );
  }

  // Validar URL
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return NextResponse.json(
      { error: "URL inválida" },
      { status: 400 }
    );
  }

  // SSRF protection
  const hostname = parsedUrl.hostname.toLowerCase();
  const blockedPatterns = [
    /^localhost$/i, /^127\./, /^10\./, /^172\.(1[6-9]|2\d|3[01])\./,
    /^192\.168\./, /^0\./, /^169\.254\./, /^::1$/, /^fc00:/i, /^fe80:/i,
    /\.local$/i, /\.internal$/i,
  ];
  if (blockedPatterns.some((p) => p.test(hostname)) || !["https:", "http:"].includes(parsedUrl.protocol)) {
    return NextResponse.json(
      { error: "URL não permitida: endereços internos são bloqueados" },
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
    where: { organizationId: session!.user.organizationId! },
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
      userId: session!.user.id,
      organizationId: session!.user.organizationId!,
      name,
      url,
      events,
      secret,
    },
  });

  return NextResponse.json({ webhook }, { status: 201 });
}, { requiredPermission: "webhooks:create" });
