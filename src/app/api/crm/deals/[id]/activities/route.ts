import { NextRequest, NextResponse } from "next/server";
import { apiHandler, getDealsFilter } from "@/lib/api-handler";
import { db } from "@/lib/db";

export const GET = apiHandler(async (req: NextRequest, { params, session }) => {
  const dealId = params?.id;

  // Build filter with organizationId and role-based access
  const baseFilter = getDealsFilter(session);

  // Verificar se o deal pertence à organização do usuário
  const deal = await db.deal.findFirst({
    where: { id: dealId, ...baseFilter },
  });

  if (!deal) {
    return NextResponse.json(
      { error: "Deal não encontrado" },
      { status: 404 }
    );
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") || "50")));

  const [activities, total] = await Promise.all([
    db.dealActivity.findMany({
      where: { dealId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
    }),
    db.dealActivity.count({ where: { dealId } }),
  ]);

  return NextResponse.json({
    activities,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
}, { requiredPermission: "deals:read_own" });

export const POST = apiHandler(async (req: NextRequest, { params, session }) => {
  const dealId = params?.id;
  const body = await req.json();
  const { activityType, content, metadata } = body;

  // Build filter with organizationId and role-based access
  const baseFilter = getDealsFilter(session);

  // Verificar se o deal pertence à organização do usuário
  const deal = await db.deal.findFirst({
    where: { id: dealId, ...baseFilter },
  });

  if (!deal) {
    return NextResponse.json(
      { error: "Deal não encontrado" },
      { status: 404 }
    );
  }

  if (!activityType) {
    return NextResponse.json(
      { error: "Tipo de atividade é obrigatório" },
      { status: 400 }
    );
  }

  const activity = await db.dealActivity.create({
    data: {
      organizationId: session!.user.organizationId!,
      dealId: dealId!,
      userId: session!.user.id,
      activityType,
      content: content || null,
      metadata: metadata || null,
    },
    include: {
      user: {
        select: { name: true, email: true },
      },
    },
  });

  // Atualizar lastContactAt do deal
  await db.deal.update({
    where: { id: dealId },
    data: { lastContactAt: new Date() },
  });

  return NextResponse.json({ activity });
}, { requiredPermission: "deals:update" });
