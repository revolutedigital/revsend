import { NextRequest, NextResponse } from "next/server";
import { apiHandler, getDealsFilter } from "@/lib/api-handler";
import { db } from "@/lib/db";
import { getNextAssignee } from "@/lib/lead-roulette";

export const GET = apiHandler(async (req: NextRequest, { session }) => {
  const { searchParams } = new URL(req.url);
  const stageId = searchParams.get("stageId");
  const assignedToId = searchParams.get("assignedToId");
  const leadStatus = searchParams.get("leadStatus");
  const search = searchParams.get("search") || "";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") || "100")));

  // Base filter with org and role restrictions
  const where: Record<string, unknown> = getDealsFilter(session);

  if (stageId) {
    where.stageId = stageId;
  }

  // Gerente/Master can filter by assignedTo
  if (assignedToId && session!.user.role !== "vendedor") {
    where.assignedToId = assignedToId;
  }

  // Filter by lead status (contact's lead status)
  if (leadStatus) {
    where.contact = { leadStatus };
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
            leadScore: true,
            leadStatus: true,
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
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
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
}, { requiredPermission: "deals:read_own" });

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
    assignedToId,
    useRoulette, // If true, use roulette even if assignedToId is provided
  } = body;

  if (!title) {
    return NextResponse.json(
      { error: "Título é obrigatório" },
      { status: 400 }
    );
  }

  const orgId = session!.user.organizationId!;

  // Se não tiver stageId, pegar o primeiro estágio da organização
  let finalStageId = stageId;
  if (!finalStageId) {
    const firstStage = await db.pipelineStage.findFirst({
      where: { organizationId: orgId },
      orderBy: { orderIndex: "asc" },
    });
    if (!firstStage) {
      return NextResponse.json(
        { error: "Nenhum estágio encontrado. Configure o pipeline primeiro." },
        { status: 400 }
      );
    }
    finalStageId = firstStage.id;
  } else {
    // Validate stageId belongs to organization
    const stage = await db.pipelineStage.findFirst({
      where: { id: finalStageId, organizationId: orgId },
    });
    if (!stage) {
      return NextResponse.json(
        { error: "Estágio não encontrado" },
        { status: 404 }
      );
    }
  }

  // Validate contactId belongs to organization's lists
  if (contactId) {
    const contact = await db.contact.findFirst({
      where: { id: contactId, list: { organizationId: orgId } },
    });
    if (!contact) {
      return NextResponse.json(
        { error: "Contato não encontrado" },
        { status: 404 }
      );
    }
  }

  // Determine assignedToId
  let finalAssignedToId = session!.user.id; // Default: assign to creator
  let assignedViaRoulette = false;

  // If useRoulette is explicitly true, or no assignedToId and user can use roulette
  if (useRoulette || (!assignedToId && session!.user.role !== "vendedor")) {
    // Try to get next assignee from roulette
    const rouletteAssignee = await getNextAssignee(orgId);
    if (rouletteAssignee) {
      finalAssignedToId = rouletteAssignee;
      assignedViaRoulette = true;
    }
  }

  // Gerente/Master can override with explicit assignment
  if (assignedToId && !useRoulette && session!.user.role !== "vendedor") {
    // Validate assignedToId is a member of the org
    const membership = await db.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: orgId,
          userId: assignedToId,
        },
      },
    });
    if (!membership) {
      return NextResponse.json(
        { error: "Usuário não é membro da organização" },
        { status: 400 }
      );
    }
    finalAssignedToId = assignedToId;
    assignedViaRoulette = false;
  }

  const deal = await db.deal.create({
    data: {
      organizationId: orgId,
      userId: session!.user.id,
      assignedToId: finalAssignedToId,
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
      assignedTo: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  // Criar atividade de criação
  await db.dealActivity.create({
    data: {
      organizationId: orgId,
      dealId: deal.id,
      userId: session!.user.id,
      activityType: "stage_change",
      content: assignedViaRoulette
        ? `Deal criado no estágio "${deal.stage.name}" (atribuído via roleta)`
        : `Deal criado no estágio "${deal.stage.name}"`,
      metadata: {
        action: "created",
        stage: deal.stage.name,
        assignedViaRoulette,
      },
    },
  });

  // Notify assigned user if different from creator
  if (finalAssignedToId !== session!.user.id) {
    await db.notification.create({
      data: {
        organizationId: orgId,
        userId: finalAssignedToId,
        type: "deal_assigned",
        title: "Novo deal atribuído",
        message: `O deal "${title}" foi atribuído a você.`,
        metadata: {
          dealId: deal.id,
          assignedBy: session!.user.id,
        },
      },
    });
  }

  return NextResponse.json({ deal });
}, { requiredPermission: "deals:create" });
