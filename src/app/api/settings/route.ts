import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { db } from "@/lib/db";
import { encrypt } from "@/lib/encryption";

// GET - Buscar configuracoes do usuario
export const GET = apiHandler(async (_req: NextRequest, { session }) => {
  const settings = await db.userSettings.findUnique({
    where: { userId: session!.user.id },
    select: {
      anthropicApiKey: true,
    },
  });

  const user = await db.user.findUnique({
    where: { id: session!.user.id },
    select: {
      twoFactorEnabled: true,
    },
  });

  return NextResponse.json({
    hasAnthropicKey: !!settings?.anthropicApiKey,
    twoFactorEnabled: user?.twoFactorEnabled || false,
    // Nao retorna a key completa por seguranca, apenas se existe
  });
});

// POST - Salvar configuracoes do usuario
export const POST = apiHandler(async (req: NextRequest, { session }) => {
  const { anthropicApiKey } = await req.json();

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
    where: { userId: session!.user.id },
    update: {
      anthropicApiKey: encryptedApiKey,
    },
    create: {
      userId: session!.user.id,
      anthropicApiKey: encryptedApiKey,
    },
  });

  return NextResponse.json({ success: true });
});
