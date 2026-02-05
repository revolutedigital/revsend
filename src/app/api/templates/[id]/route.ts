import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { db } from "@/lib/db";

// GET - Buscar template específico
export const GET = apiHandler(async (_req: NextRequest, { params, session }) => {
  const template = await db.messageTemplate.findFirst({
    where: {
      id: params?.id,
      organizationId: session!.user.organizationId!,
    },
  });

  if (!template) {
    return NextResponse.json(
      { error: "Template não encontrado" },
      { status: 404 }
    );
  }

  return NextResponse.json({ template });
}, { requiredPermission: 'templates:read' });

// PUT - Atualizar template
export const PUT = apiHandler(async (req: NextRequest, { params, session }) => {
  // Verificar se o template pertence à organização
  const existing = await db.messageTemplate.findFirst({
    where: {
      id: params?.id,
      organizationId: session!.user.organizationId!,
    },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Template não encontrado" },
      { status: 404 }
    );
  }

  const body = await req.json();
  const { name, category, content, mediaType, mediaUrl, mediaName } = body;

  const template = await db.messageTemplate.update({
    where: { id: params?.id },
    data: {
      name: name ?? existing.name,
      category: category !== undefined ? category : existing.category,
      content: content ?? existing.content,
      mediaType: mediaType !== undefined ? mediaType : existing.mediaType,
      mediaUrl: mediaUrl !== undefined ? mediaUrl : existing.mediaUrl,
      mediaName: mediaName !== undefined ? mediaName : existing.mediaName,
    },
  });

  return NextResponse.json({ template });
}, { requiredPermission: 'templates:update' });

// DELETE - Excluir template
export const DELETE = apiHandler(async (_req: NextRequest, { params, session }) => {
  // Verificar se o template pertence à organização
  const existing = await db.messageTemplate.findFirst({
    where: {
      id: params?.id,
      organizationId: session!.user.organizationId!,
    },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Template não encontrado" },
      { status: 404 }
    );
  }

  await db.messageTemplate.delete({
    where: { id: params?.id },
  });

  return NextResponse.json({ success: true });
}, { requiredPermission: 'templates:delete' });
