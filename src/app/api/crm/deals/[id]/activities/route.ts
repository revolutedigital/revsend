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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

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
  } catch (error) {
    console.error("Erro ao buscar atividades:", error);
    return NextResponse.json(
      { error: "Erro ao buscar atividades" },
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
    const { activityType, content, metadata } = body;

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

    if (!activityType) {
      return NextResponse.json(
        { error: "Tipo de atividade é obrigatório" },
        { status: 400 }
      );
    }

    const activity = await db.dealActivity.create({
      data: {
        dealId,
        userId: session.user.id,
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
  } catch (error) {
    console.error("Erro ao criar atividade:", error);
    return NextResponse.json(
      { error: "Erro ao criar atividade" },
      { status: 500 }
    );
  }
}
