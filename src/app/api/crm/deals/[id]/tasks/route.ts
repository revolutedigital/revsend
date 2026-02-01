import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { db } from "@/lib/db";

export const GET = apiHandler(async (_req: NextRequest, { params, session }) => {
  const dealId = params?.id;

  // Verificar se o deal pertence ao usuário
  const deal = await db.deal.findFirst({
    where: { id: dealId, userId: session!.user.id },
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
});

export const POST = apiHandler(async (req: NextRequest, { params, session }) => {
  const dealId = params?.id;
  const body = await req.json();
  const { title, description, dueDate, priority } = body;

  // Verificar se o deal pertence ao usuário
  const deal = await db.deal.findFirst({
    where: { id: dealId, userId: session!.user.id },
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
      dealId: dealId!,
      userId: session!.user.id,
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
});

export const PUT = apiHandler(async (req: NextRequest, { params, session }) => {
  const dealId = params?.id;
  const body = await req.json();
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
      deal: { userId: session!.user.id },
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
          dealId: dealId!,
          userId: session!.user.id,
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
});

export const DELETE = apiHandler(async (req: NextRequest, { params, session }) => {
  const dealId = params?.id;
  const { searchParams } = new URL(req.url);
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
      deal: { userId: session!.user.id },
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
});
