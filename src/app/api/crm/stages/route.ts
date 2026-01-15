import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
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

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    let stages = await db.pipelineStage.findMany({
      where: { userId: session.user.id },
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
          userId: session.user.id,
        })),
      });

      stages = await db.pipelineStage.findMany({
        where: { userId: session.user.id },
        orderBy: { orderIndex: "asc" },
        include: {
          _count: {
            select: { deals: true },
          },
        },
      });
    }

    return NextResponse.json({ stages });
  } catch (error) {
    console.error("Erro ao buscar estágios:", error);
    return NextResponse.json(
      { error: "Erro ao buscar estágios" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { name, color, isFinal, isWon } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Nome é obrigatório" },
        { status: 400 }
      );
    }

    // Buscar o maior orderIndex
    const lastStage = await db.pipelineStage.findFirst({
      where: { userId: session.user.id },
      orderBy: { orderIndex: "desc" },
    });

    const stage = await db.pipelineStage.create({
      data: {
        userId: session.user.id,
        name,
        color: color || "#6B7280",
        orderIndex: (lastStage?.orderIndex ?? -1) + 1,
        isFinal: isFinal || false,
        isWon: isWon || false,
      },
    });

    return NextResponse.json({ stage });
  } catch (error) {
    console.error("Erro ao criar estágio:", error);
    return NextResponse.json(
      { error: "Erro ao criar estágio" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
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
            userId: session.user.id,
          },
          data: { orderIndex: stage.orderIndex },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao reordenar estágios:", error);
    return NextResponse.json(
      { error: "Erro ao reordenar estágios" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const stageId = searchParams.get("id");

    if (!stageId) {
      return NextResponse.json(
        { error: "ID do estágio não fornecido" },
        { status: 400 }
      );
    }

    // Verificar se há deals neste estágio
    const dealsCount = await db.deal.count({
      where: { stageId, userId: session.user.id },
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
        userId: session.user.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao excluir estágio:", error);
    return NextResponse.json(
      { error: "Erro ao excluir estágio" },
      { status: 500 }
    );
  }
}
