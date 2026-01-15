import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get("campaignId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where = {
      campaign: {
        userId: session.user.id,
      },
      ...(campaignId ? { campaignId } : {}),
    };

    const [replies, total] = await Promise.all([
      db.reply.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { receivedAt: "desc" },
        include: {
          contact: {
            select: {
              name: true,
              phoneNumber: true,
            },
          },
          campaign: {
            select: {
              name: true,
            },
          },
          whatsappNumber: {
            select: {
              name: true,
              phoneNumber: true,
            },
          },
        },
      }),
      db.reply.count({ where }),
    ]);

    return NextResponse.json({
      replies,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Erro ao buscar respostas:", error);
    return NextResponse.json(
      { error: "Erro ao buscar respostas" },
      { status: 500 }
    );
  }
}
