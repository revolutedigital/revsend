import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { db } from "@/lib/db";

// Estágios padrão para novos usuários
const DEFAULT_STAGES = [
  { name: "Novo Lead", color: "#6B7280", orderIndex: 0, isFinal: false, isWon: false },
  { name: "Contato Feito", color: "#3B82F6", orderIndex: 1, isFinal: false, isWon: false },
  { name: "Respondeu", color: "#8B5CF6", orderIndex: 2, isFinal: false, isWon: false },
  { name: "Qualificado", color: "#F59E0B", orderIndex: 3, isFinal: false, isWon: false },
  { name: "Em Negociação", color: "#EC4899", orderIndex: 4, isFinal: false, isWon: false },
  { name: "Ganho", color: "#10B981", orderIndex: 5, isFinal: true, isWon: true },
  { name: "Perdido", color: "#EF4444", orderIndex: 6, isFinal: true, isWon: false },
];

export const GET = apiHandler(async (_req: NextRequest, { session }) => {
  let stages = await db.pipelineStage.findMany({
    where: { organizationId: session!.user.organizationId! },
    orderBy: { orderIndex: "asc" },
    include: {
      _count: {
        select: { deals: true },
      },
    },
  });

  // Se não houver estágios, criar os padrão
  if (stages.length === 0) {
    await db.pipelineStage.createMany({
      data: DEFAULT_STAGES.map((stage) => ({
        ...stage,
        organizationId: session!.user.organizationId!,
        userId: session!.user.id,
      })),
    });

    stages = await db.pipelineStage.findMany({
      where: { organizationId: session!.user.organizationId! },
      orderBy: { orderIndex: "asc" },
      include: {
        _count: {
          select: { deals: true },
        },
      },
    });
  }

  return NextResponse.json({ stages });
}, { requiredPermission: "pipeline:read" });

export const POST = apiHandler(async (req: NextRequest, { session }) => {
  const body = await req.json();
  const { name, color, isFinal, isWon } = body;

  if (!name) {
    return NextResponse.json(
      { error: "Nome é obrigatório" },
      { status: 400 }
    );
  }

  // Buscar o maior orderIndex
  const lastStage = await db.pipelineStage.findFirst({
    where: { organizationId: session!.user.organizationId! },
    orderBy: { orderIndex: "desc" },
  });

  const stage = await db.pipelineStage.create({
    data: {
      organizationId: session!.user.organizationId!,
      userId: session!.user.id,
      name,
      color: color || "#6B7280",
      orderIndex: (lastStage?.orderIndex ?? -1) + 1,
      isFinal: isFinal || false,
      isWon: isWon || false,
    },
  });

  return NextResponse.json({ stage });
}, { requiredPermission: "pipeline:create" });

export const PUT = apiHandler(async (req: NextRequest, { session }) => {
  const body = await req.json();
  const { stages } = body;

  if (!Array.isArray(stages)) {
    return NextResponse.json(
      { error: "Dados inválidos" },
      { status: 400 }
    );
  }

  // Atualizar a ordem de todos os estágios
  await Promise.all(
    stages.map((stage: { id: string; orderIndex: number }) =>
      db.pipelineStage.update({
        where: {
          id: stage.id,
          organizationId: session!.user.organizationId!,
        },
        data: { orderIndex: stage.orderIndex },
      })
    )
  );

  return NextResponse.json({ success: true });
}, { requiredPermission: "pipeline:create" });

export const DELETE = apiHandler(async (req: NextRequest, { session }) => {
  const { searchParams } = new URL(req.url);
  const stageId = searchParams.get("id");

  if (!stageId) {
    return NextResponse.json(
      { error: "ID do estágio não fornecido" },
      { status: 400 }
    );
  }

  // Verificar se há deals neste estágio
  const dealsCount = await db.deal.count({
    where: { stageId, organizationId: session!.user.organizationId! },
  });

  if (dealsCount > 0) {
    return NextResponse.json(
      { error: "Não é possível excluir estágio com deals" },
      { status: 400 }
    );
  }

  await db.pipelineStage.delete({
    where: {
      id: stageId,
      organizationId: session!.user.organizationId!,
    },
  });

  return NextResponse.json({ success: true });
}, { requiredPermission: "pipeline:create" });
