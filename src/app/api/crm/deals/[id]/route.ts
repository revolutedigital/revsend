import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;

    const deal = await db.deal.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        contact: {
          select: {
            id: true,
            name: true,
            phoneNumber: true,
            extraFields: true,
            list: {
              select: { name: true },
            },
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
        activities: {
          orderBy: { createdAt: "desc" },
          take: 50,
          include: {
            user: {
              select: { name: true, email: true },
            },
          },
        },
        tasks: {
          orderBy: [{ completedAt: "asc" }, { dueDate: "asc" }],
          include: {
            user: {
              select: { name: true },
            },
          },
        },
      },
    });

    if (!deal) {
      return NextResponse.json(
        { error: "Deal não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ deal });
  } catch (error) {
    console.error("Erro ao buscar deal:", error);
    return NextResponse.json(
      { error: "Erro ao buscar deal" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Verificar se o deal existe
    const existingDeal = await db.deal.findFirst({
      where: { id, userId: session.user.id },
      include: { stage: { select: { name: true } } },
    });

    if (!existingDeal) {
      return NextResponse.json(
        { error: "Deal não encontrado" },
        { status: 404 }
      );
    }

    const {
      title,
      stageId,
      value,
      probability,
      company,
      notes,
      expectedCloseDate,
      nextActionAt,
      nextActionNote,
      lostReason,
    } = body;

    // Preparar dados de atualização
    const updateData: Record<string, unknown> = {};
    const activities: Array<{
      dealId: string;
      userId: string;
      activityType: string;
      content: string;
      metadata: object;
    }> = [];

    if (title !== undefined) updateData.title = title;
    if (company !== undefined) updateData.company = company;
    if (notes !== undefined) updateData.notes = notes;
    if (probability !== undefined) updateData.probability = probability;
    if (value !== undefined) updateData.value = value ? parseFloat(value) : null;
    if (expectedCloseDate !== undefined) {
      updateData.expectedCloseDate = expectedCloseDate ? new Date(expectedCloseDate) : null;
    }
    if (nextActionAt !== undefined) {
      updateData.nextActionAt = nextActionAt ? new Date(nextActionAt) : null;
    }
    if (nextActionNote !== undefined) updateData.nextActionNote = nextActionNote;

    // Mudança de estágio
    if (stageId && stageId !== existingDeal.stageId) {
      const newStage = await db.pipelineStage.findFirst({
        where: { id: stageId, userId: session.user.id },
      });

      if (!newStage) {
        return NextResponse.json(
          { error: "Estágio não encontrado" },
          { status: 404 }
        );
      }

      updateData.stageId = stageId;
      updateData.lastContactAt = new Date();

      // Se for estágio final
      if (newStage.isFinal) {
        if (newStage.isWon) {
          updateData.wonAt = new Date();
          updateData.lostAt = null;
          updateData.lostReason = null;
        } else {
          updateData.lostAt = new Date();
          updateData.wonAt = null;
          updateData.lostReason = lostReason || null;
        }
      } else {
        updateData.wonAt = null;
        updateData.lostAt = null;
        updateData.lostReason = null;
      }

      activities.push({
        dealId: id,
        userId: session.user.id,
        activityType: "stage_change",
        content: `Movido de "${existingDeal.stage.name}" para "${newStage.name}"`,
        metadata: {
          fromStage: existingDeal.stage.name,
          toStage: newStage.name,
          fromStageId: existingDeal.stageId,
          toStageId: stageId,
        },
      });
    }

    // Atualizar deal
    const deal = await db.deal.update({
      where: { id },
      data: updateData,
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
            isFinal: true,
            isWon: true,
          },
        },
      },
    });

    // Criar atividades
    if (activities.length > 0) {
      await db.dealActivity.createMany({ data: activities });
    }

    return NextResponse.json({ deal });
  } catch (error) {
    console.error("Erro ao atualizar deal:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar deal" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;

    const deal = await db.deal.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!deal) {
      return NextResponse.json(
        { error: "Deal não encontrado" },
        { status: 404 }
      );
    }

    await db.deal.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao excluir deal:", error);
    return NextResponse.json(
      { error: "Erro ao excluir deal" },
      { status: 500 }
    );
  }
}
