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

    const { id: dealId } = await params;

    // Verificar se o deal pertence ao usuário
    const deal = await db.deal.findFirst({
      where: { id: dealId, userId: session.user.id },
    });

    if (!deal) {
      return NextResponse.json(
        { error: "Deal não encontrado" },
        { status: 404 }
      );
    }

    const tasks = await db.dealTask.findMany({
      where: { dealId },
      orderBy: [{ completedAt: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
      include: {
        user: {
          select: { name: true },
        },
      },
    });

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error("Erro ao buscar tarefas:", error);
    return NextResponse.json(
      { error: "Erro ao buscar tarefas" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id: dealId } = await params;
    const body = await request.json();
    const { title, description, dueDate, priority } = body;

    // Verificar se o deal pertence ao usuário
    const deal = await db.deal.findFirst({
      where: { id: dealId, userId: session.user.id },
    });

    if (!deal) {
      return NextResponse.json(
        { error: "Deal não encontrado" },
        { status: 404 }
      );
    }

    if (!title) {
      return NextResponse.json(
        { error: "Título é obrigatório" },
        { status: 400 }
      );
    }

    const task = await db.dealTask.create({
      data: {
        dealId,
        userId: session.user.id,
        title,
        description: description || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        priority: priority || "medium",
      },
      include: {
        user: {
          select: { name: true },
        },
      },
    });

    return NextResponse.json({ task });
  } catch (error) {
    console.error("Erro ao criar tarefa:", error);
    return NextResponse.json(
      { error: "Erro ao criar tarefa" },
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

    const { id: dealId } = await params;
    const body = await request.json();
    const { taskId, title, description, dueDate, priority, completed } = body;

    if (!taskId) {
      return NextResponse.json(
        { error: "ID da tarefa é obrigatório" },
        { status: 400 }
      );
    }

    // Verificar se a tarefa pertence ao deal do usuário
    const task = await db.dealTask.findFirst({
      where: {
        id: taskId,
        dealId,
        deal: { userId: session.user.id },
      },
    });

    if (!task) {
      return NextResponse.json(
        { error: "Tarefa não encontrada" },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (priority !== undefined) updateData.priority = priority;

    // Toggle completed
    if (completed !== undefined) {
      if (completed && !task.completedAt) {
        updateData.completedAt = new Date();

        // Criar atividade de tarefa concluída
        await db.dealActivity.create({
          data: {
            dealId,
            userId: session.user.id,
            activityType: "task_completed",
            content: `Tarefa concluída: "${task.title}"`,
            metadata: { taskId, taskTitle: task.title },
          },
        });
      } else if (!completed && task.completedAt) {
        updateData.completedAt = null;
      }
    }

    const updatedTask = await db.dealTask.update({
      where: { id: taskId },
      data: updateData,
      include: {
        user: {
          select: { name: true },
        },
      },
    });

    return NextResponse.json({ task: updatedTask });
  } catch (error) {
    console.error("Erro ao atualizar tarefa:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar tarefa" },
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

    const { id: dealId } = await params;
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get("taskId");

    if (!taskId) {
      return NextResponse.json(
        { error: "ID da tarefa não fornecido" },
        { status: 400 }
      );
    }

    // Verificar se a tarefa pertence ao deal do usuário
    const task = await db.dealTask.findFirst({
      where: {
        id: taskId,
        dealId,
        deal: { userId: session.user.id },
      },
    });

    if (!task) {
      return NextResponse.json(
        { error: "Tarefa não encontrada" },
        { status: 404 }
      );
    }

    await db.dealTask.delete({ where: { id: taskId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao excluir tarefa:", error);
    return NextResponse.json(
      { error: "Erro ao excluir tarefa" },
      { status: 500 }
    );
  }
}
