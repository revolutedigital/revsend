import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { scheduleCampaign } from "@/lib/queue/scheduler";
import { startCampaignDispatch } from "@/lib/queue/dispatcher";

interface MessageInput {
  content: string;
  mediaType?: string;
  mediaUrl?: string;
  mediaName?: string;
}

// GET - Listar campanhas do usuário
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const campaigns = await db.campaign.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        list: {
          select: {
            name: true,
            totalContacts: true,
          },
        },
        _count: {
          select: {
            messages: true,
            campaignNumbers: true,
          },
        },
      },
    });

    return NextResponse.json({ campaigns });
  } catch (error) {
    console.error("Erro ao buscar campanhas:", error);
    return NextResponse.json(
      { error: "Erro ao buscar campanhas" },
      { status: 500 }
    );
  }
}

// POST - Criar nova campanha
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      listId,
      messages,
      minIntervalSeconds,
      maxIntervalSeconds,
      whatsappNumberIds,
      scheduledAt,
      startImmediately,
    } = body;

    // Validações
    if (!name || !listId || !messages?.length || !whatsappNumberIds?.length) {
      return NextResponse.json(
        { error: "Dados incompletos" },
        { status: 400 }
      );
    }

    // Verificar se a lista pertence ao usuário
    const list = await db.contactList.findFirst({
      where: {
        id: listId,
        userId: session.user.id,
      },
    });

    if (!list) {
      return NextResponse.json(
        { error: "Lista não encontrada" },
        { status: 404 }
      );
    }

    // Verificar se os números pertencem ao usuário
    const numbers = await db.whatsappNumber.findMany({
      where: {
        id: { in: whatsappNumberIds },
        userId: session.user.id,
      },
    });

    if (numbers.length !== whatsappNumberIds.length) {
      return NextResponse.json(
        { error: "Números de WhatsApp inválidos" },
        { status: 400 }
      );
    }

    // Criar campanha
    const campaign = await db.campaign.create({
      data: {
        userId: session.user.id,
        listId,
        name,
        minIntervalSeconds: minIntervalSeconds || 30,
        maxIntervalSeconds: maxIntervalSeconds || 120,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        messages: {
          create: (messages as MessageInput[]).map((msg, index) => ({
            content: msg.content,
            mediaType: msg.mediaType || null,
            mediaUrl: msg.mediaUrl || null,
            mediaName: msg.mediaName || null,
            orderIndex: index,
          })),
        },
        campaignNumbers: {
          create: whatsappNumberIds.map((id: string) => ({
            whatsappNumberId: id,
          })),
        },
      },
      include: {
        messages: true,
        campaignNumbers: true,
      },
    });

    // Agendar ou iniciar a campanha
    if (scheduledAt) {
      await scheduleCampaign(campaign.id, new Date(scheduledAt));
    } else if (startImmediately) {
      await startCampaignDispatch(campaign.id);
    }

    return NextResponse.json({ campaign }, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar campanha:", error);
    return NextResponse.json(
      { error: "Erro ao criar campanha" },
      { status: 500 }
    );
  }
}
