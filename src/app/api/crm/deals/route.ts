import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { db } from "@/lib/db";

export const GET = apiHandler(async (req: NextRequest, { session }) => {
  const { searchParams } = new URL(req.url);
  const stageId = searchParams.get("stageId");
  const search = searchParams.get("search") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "100");

  const where: Record<string, unknown> = {
    userId: session!.user.id,
  };

  if (stageId) {
    where.stageId = stageId;
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { company: { contains: search, mode: "insensitive" } },
      { contact: { name: { contains: search, mode: "insensitive" } } },
      { contact: { phoneNumber: { contains: search } } },
    ];
  }

  const [deals, total] = await Promise.all([
    db.deal.findMany({
      where,
      orderBy: [{ stageId: "asc" }, { updatedAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
      include: {
        contact: {
          select: {
            id: true,
            name: true,
            phoneNumber: true,
            extraFields: true,
          },
        },
        stage: {
          select: {
            id: true,
            name: true,
            color: true,
            isFinal: true,
            isWon: true,
          },
        },
        _count: {
          select: {
            activities: true,
            tasks: true,
          },
        },
      },
    }),
    db.deal.count({ where }),
  ]);

  return NextResponse.json({
    deals,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

export const POST = apiHandler(async (req: NextRequest, { session }) => {
  const body = await req.json();
  const {
    title,
    contactId,
    stageId,
    value,
    probability,
    company,
    notes,
    expectedCloseDate,
  } = body;

  if (!title) {
    return NextResponse.json(
      { error: "Título é obrigatório" },
      { status: 400 }
    );
  }

  // Se não tiver stageId, pegar o primeiro estágio do usuário
  let finalStageId = stageId;
  if (!finalStageId) {
    const firstStage = await db.pipelineStage.findFirst({
      where: { userId: session!.user.id },
      orderBy: { orderIndex: "asc" },
    });
    if (!firstStage) {
      return NextResponse.json(
        { error: "Nenhum estágio encontrado. Configure o pipeline primeiro." },
        { status: 400 }
      );
    }
    finalStageId = firstStage.id;
  }

  const deal = await db.deal.create({
    data: {
      userId: session!.user.id,
      title,
      contactId: contactId || null,
      stageId: finalStageId,
      value: value ? parseFloat(value) : null,
      probability: probability || 50,
      company: company || null,
      notes: notes || null,
      expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : null,
    },
    include: {
      contact: {
        select: {
          id: true,
          name: true,
          phoneNumber: true,
        },
      },
      stage: {
        select: {
          id: true,
          name: true,
          color: true,
        },
      },
    },
  });

  // Criar atividade de criação
  await db.dealActivity.create({
    data: {
      dealId: deal.id,
      userId: session!.user.id,
      activityType: "stage_change",
      content: `Deal criado no estágio "${deal.stage.name}"`,
      metadata: { action: "created", stage: deal.stage.name },
    },
  });

  return NextResponse.json({ deal });
});
