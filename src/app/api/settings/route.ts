import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { encrypt } from "@/lib/encryption";

// GET - Buscar configuracoes do usuario
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const settings = await db.userSettings.findUnique({
      where: { userId: session.user.id },
      select: {
        anthropicApiKey: true,
      },
    });

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        twoFactorEnabled: true,
      },
    });

    return NextResponse.json({
      hasAnthropicKey: !!settings?.anthropicApiKey,
      twoFactorEnabled: user?.twoFactorEnabled || false,
      // Nao retorna a key completa por seguranca, apenas se existe
    });
  } catch (error) {
    console.error("Erro ao buscar configuracoes:", error);
    return NextResponse.json(
      { error: "Erro ao buscar configuracoes" },
      { status: 500 }
    );
  }
}

// POST - Salvar configuracoes do usuario
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const { anthropicApiKey } = await request.json();

    // Validar formato basico da API key
    if (anthropicApiKey && !anthropicApiKey.startsWith("sk-ant-")) {
      return NextResponse.json(
        { error: "API key invalida. Deve comecar com sk-ant-" },
        { status: 400 }
      );
    }

    // Encriptar a API key antes de salvar
    const encryptedApiKey = anthropicApiKey ? encrypt(anthropicApiKey) : null;

    // Upsert - criar ou atualizar
    await db.userSettings.upsert({
      where: { userId: session.user.id },
      update: {
        anthropicApiKey: encryptedApiKey,
      },
      create: {
        userId: session.user.id,
        anthropicApiKey: encryptedApiKey,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao salvar configuracoes:", error);
    return NextResponse.json(
      { error: "Erro ao salvar configuracoes" },
      { status: 500 }
    );
  }
}
