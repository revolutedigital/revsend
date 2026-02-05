import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { db } from "@/lib/db";
import crypto from "crypto";

// GET - List pending invites for organization
export const GET = apiHandler(async (_req: NextRequest, { params, session }) => {
  // Verify user can manage this organization
  if (!session!.user.isMaster) {
    const membership = await db.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: params!.id,
          userId: session!.user.id,
        },
      },
    });

    if (!membership || membership.role !== "gerente") {
      return NextResponse.json(
        { error: "Você não tem permissão para gerenciar convites" },
        { status: 403 }
      );
    }
  }

  const invites = await db.organizationInvite.findMany({
    where: {
      organizationId: params!.id,
      status: "pending",
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
    include: {
      invitedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return NextResponse.json({ invites });
}, { requiredPermission: "members:invite" });

// POST - Create a new invite
export const POST = apiHandler(async (req: NextRequest, { params, session }) => {
  const body = await req.json();
  const { email, role, type = "email" } = body;

  // Verify user can manage this organization
  if (!session!.user.isMaster) {
    const membership = await db.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: params!.id,
          userId: session!.user.id,
        },
      },
    });

    if (!membership || membership.role !== "gerente") {
      return NextResponse.json(
        { error: "Você não tem permissão para convidar membros" },
        { status: 403 }
      );
    }
  }

  // Validate role
  const validRoles = ["gerente", "vendedor"];
  if (!validRoles.includes(role)) {
    return NextResponse.json(
      { error: "Role inválido. Use 'gerente' ou 'vendedor'" },
      { status: 400 }
    );
  }

  // For email invites, email is required
  if (type === "email" && !email) {
    return NextResponse.json(
      { error: "Email é obrigatório para convites por email" },
      { status: 400 }
    );
  }

  // Check if user is already a member
  if (email) {
    const existingUser = await db.user.findUnique({
      where: { email },
      include: {
        organizations: {
          where: { organizationId: params!.id },
        },
      },
    });

    if (existingUser?.organizations.length) {
      return NextResponse.json(
        { error: "Este usuário já é membro da organização" },
        { status: 400 }
      );
    }

    // Check for existing pending invite
    const existingInvite = await db.organizationInvite.findFirst({
      where: {
        organizationId: params!.id,
        email,
        status: "pending",
        expiresAt: { gt: new Date() },
      },
    });

    if (existingInvite) {
      return NextResponse.json(
        { error: "Já existe um convite pendente para este email" },
        { status: 400 }
      );
    }
  }

  // Generate secure token
  const token = crypto.randomBytes(32).toString("hex");

  // Set expiration (7 days for email, 30 days for link)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + (type === "link" ? 30 : 7));

  const invite = await db.organizationInvite.create({
    data: {
      organizationId: params!.id,
      email: email || null,
      role,
      token,
      invitedById: session!.user.id,
      expiresAt,
    },
    include: {
      organization: {
        select: {
          name: true,
        },
      },
    },
  });

  // Generate invite URL
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const inviteUrl = `${baseUrl}/invite/${token}`;

  // TODO: Send email if type === "email"
  // For now, just return the invite URL

  return NextResponse.json({
    invite: {
      id: invite.id,
      email: invite.email,
      role: invite.role,
      expiresAt: invite.expiresAt,
      inviteUrl,
    },
  }, { status: 201 });
}, { requiredPermission: "members:invite" });
