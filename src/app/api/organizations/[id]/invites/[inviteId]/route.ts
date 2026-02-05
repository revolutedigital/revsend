import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { db } from "@/lib/db";

// DELETE - Cancel/revoke an invite
export const DELETE = apiHandler(async (_req: NextRequest, { params, session }) => {
  const { id: orgId, inviteId } = params || {};

  if (!orgId || !inviteId) {
    return NextResponse.json(
      { error: "Parâmetros inválidos" },
      { status: 400 }
    );
  }

  // Verify user can manage this organization
  if (!session!.user.isMaster) {
    const membership = await db.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: orgId,
          userId: session!.user.id,
        },
      },
    });

    if (!membership || membership.role !== "gerente") {
      return NextResponse.json(
        { error: "Você não tem permissão para cancelar convites" },
        { status: 403 }
      );
    }
  }

  // Find the invite
  const invite = await db.organizationInvite.findFirst({
    where: {
      id: inviteId,
      organizationId: orgId,
    },
  });

  if (!invite) {
    return NextResponse.json(
      { error: "Convite não encontrado" },
      { status: 404 }
    );
  }

  // Update invite status to cancelled
  await db.organizationInvite.update({
    where: { id: inviteId },
    data: { status: "cancelled" },
  });

  return NextResponse.json({ success: true });
}, { requiredPermission: "members:invite" });
