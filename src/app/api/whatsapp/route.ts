import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET - Listar números do usuário
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const numbers = await db.whatsappNumber.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        phoneNumber: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ numbers });
  } catch (error) {
    console.error("Erro ao buscar números:", error);
    return NextResponse.json(
      { error: "Erro ao buscar números" },
      { status: 500 }
    );
  }
}

// POST - Adicionar novo número
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { name } = await request.json();

    // Verificar limite de 4 números
    const count = await db.whatsappNumber.count({
      where: { userId: session.user.id },
    });

    if (count >= 4) {
      return NextResponse.json(
        { error: "Limite de 4 números atingido" },
        { status: 400 }
      );
    }

    const number = await db.whatsappNumber.create({
      data: {
        userId: session.user.id,
        name: name || `WhatsApp ${count + 1}`,
        phoneNumber: "",
        status: "disconnected",
      },
    });

    return NextResponse.json({ number }, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar número:", error);
    return NextResponse.json(
      { error: "Erro ao criar número" },
      { status: 500 }
    );
  }
}

// DELETE - Remover número
export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const numberId = searchParams.get("id");

    if (!numberId) {
      return NextResponse.json(
        { error: "ID do número não fornecido" },
        { status: 400 }
      );
    }

    // Verificar se pertence ao usuário
    const number = await db.whatsappNumber.findFirst({
      where: {
        id: numberId,
        userId: session.user.id,
      },
    });

    if (!number) {
      return NextResponse.json(
        { error: "Número não encontrado" },
        { status: 404 }
      );
    }

    await db.whatsappNumber.delete({
      where: { id: numberId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao deletar número:", error);
    return NextResponse.json(
      { error: "Erro ao deletar número" },
      { status: 500 }
    );
  }
}
