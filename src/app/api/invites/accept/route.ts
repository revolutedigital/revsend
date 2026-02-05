import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { db } from "@/lib/db";

// GET - Validate invite token (public)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json(
      { error: "Token é obrigatório" },
      { status: 400 }
    );
  }

  const invite = await db.organizationInvite.findUnique({
    where: { token },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
        },
      },
      invitedBy: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  if (!invite) {
    return NextResponse.json(
      { error: "Convite não encontrado" },
      { status: 404 }
    );
  }

  if (invite.status !== "pending") {
    return NextResponse.json(
      { error: "Este convite já foi utilizado ou cancelado" },
      { status: 400 }
    );
  }

  if (invite.expiresAt < new Date()) {
    return NextResponse.json(
      { error: "Este convite expirou" },
      { status: 400 }
    );
  }

  return NextResponse.json({
    valid: true,
    invite: {
      email: invite.email,
      role: invite.role,
      organization: invite.organization,
      invitedBy: invite.invitedBy,
      expiresAt: invite.expiresAt,
    },
  });
}

// POST - Accept invite (requires authentication)
export const POST = apiHandler(async (req: NextRequest, { session }) => {
  const body = await req.json();
  const { token } = body;

  if (!token) {
    return NextResponse.json(
      { error: "Token é obrigatório" },
      { status: 400 }
    );
  }

  const invite = await db.organizationInvite.findUnique({
    where: { token },
    include: {
      organization: true,
    },
  });

  if (!invite) {
    return NextResponse.json(
      { error: "Convite não encontrado" },
      { status: 404 }
    );
  }

  if (invite.status !== "pending") {
    return NextResponse.json(
      { error: "Este convite já foi utilizado ou cancelado" },
      { status: 400 }
    );
  }

  if (invite.expiresAt < new Date()) {
    return NextResponse.json(
      { error: "Este convite expirou" },
      { status: 400 }
    );
  }

  // If invite has a specific email, verify it matches the user
  if (invite.email && invite.email !== session!.user.email) {
    return NextResponse.json(
      { error: "Este convite foi enviado para outro email" },
      { status: 403 }
    );
  }

  // Check if user is already a member
  const existingMembership = await db.organizationMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId: invite.organizationId,
        userId: session!.user.id,
      },
    },
  });

  if (existingMembership) {
    // Update invite status anyway
    await db.organizationInvite.update({
      where: { id: invite.id },
      data: {
        status: "accepted",
        acceptedAt: new Date(),
        acceptedById: session!.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Você já é membro desta organização",
      organization: {
        id: invite.organization.id,
        name: invite.organization.name,
      },
    });
  }

  // Create membership
  await db.organizationMember.create({
    data: {
      organizationId: invite.organizationId,
      userId: session!.user.id,
      role: invite.role,
    },
  });

  // Update invite status
  await db.organizationInvite.update({
    where: { id: invite.id },
    data: {
      status: "accepted",
      acceptedAt: new Date(),
      acceptedById: session!.user.id,
    },
  });

  // Create notification for the inviter
  await db.notification.create({
    data: {
      organizationId: invite.organizationId,
      userId: invite.invitedById,
      type: "invite_accepted",
      title: "Convite aceito",
      message: `${session!.user.name || session!.user.email} aceitou seu convite para a organização.`,
      metadata: {
        acceptedById: session!.user.id,
        organizationId: invite.organizationId,
      },
    },
  });

  return NextResponse.json({
    success: true,
    message: "Convite aceito com sucesso",
    organization: {
      id: invite.organization.id,
      name: invite.organization.name,
    },
    role: invite.role,
  });
}, { requireAuth: true, allowNoOrg: true });
