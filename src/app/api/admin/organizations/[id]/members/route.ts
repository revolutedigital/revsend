import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { db } from "@/lib/db";

// GET - List organization members (Master only)
export const GET = apiHandler(async (_req: NextRequest, { params }) => {
  const { id: orgId } = params || {};

  if (!orgId) {
    return NextResponse.json(
      { error: "ID da organização é obrigatório" },
      { status: 400 }
    );
  }

  const members = await db.organizationMember.findMany({
    where: { organizationId: orgId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          isMaster: true,
          createdAt: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({
    members: members.map((m) => ({
      id: m.id,
      role: m.role,
      joinedAt: m.createdAt,
      user: m.user,
    })),
  });
}, { requiredPermission: "admin:orgs" });

// POST - Add member to organization (Master only)
export const POST = apiHandler(async (req: NextRequest, { params }) => {
  const { id: orgId } = params || {};

  if (!orgId) {
    return NextResponse.json(
      { error: "ID da organização é obrigatório" },
      { status: 400 }
    );
  }

  const body = await req.json();
  const { userId, email, role = "vendedor" } = body;

  // Validate role
  const validRoles = ["gerente", "vendedor"];
  if (!validRoles.includes(role)) {
    return NextResponse.json(
      { error: "Role inválido. Use 'gerente' ou 'vendedor'" },
      { status: 400 }
    );
  }

  // Find user by ID or email
  let user;
  if (userId) {
    user = await db.user.findUnique({ where: { id: userId } });
  } else if (email) {
    user = await db.user.findUnique({ where: { email } });
  } else {
    return NextResponse.json(
      { error: "userId ou email é obrigatório" },
      { status: 400 }
    );
  }

  if (!user) {
    return NextResponse.json(
      { error: "Usuário não encontrado" },
      { status: 404 }
    );
  }

  // Check if already a member
  const existingMembership = await db.organizationMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId: orgId,
        userId: user.id,
      },
    },
  });

  if (existingMembership) {
    return NextResponse.json(
      { error: "Usuário já é membro desta organização" },
      { status: 400 }
    );
  }

  // Check if organization exists
  const org = await db.organization.findUnique({ where: { id: orgId } });
  if (!org) {
    return NextResponse.json(
      { error: "Organização não encontrada" },
      { status: 404 }
    );
  }

  // Create membership
  const member = await db.organizationMember.create({
    data: {
      organizationId: orgId,
      userId: user.id,
      role,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return NextResponse.json({
    member: {
      id: member.id,
      role: member.role,
      joinedAt: member.createdAt,
      user: member.user,
    },
  }, { status: 201 });
}, { requiredPermission: "admin:orgs" });

// PUT - Update member role (Master only)
export const PUT = apiHandler(async (req: NextRequest, { params }) => {
  const { id: orgId } = params || {};

  if (!orgId) {
    return NextResponse.json(
      { error: "ID da organização é obrigatório" },
      { status: 400 }
    );
  }

  const body = await req.json();
  const { memberId, userId, role } = body;

  // Validate role
  const validRoles = ["gerente", "vendedor"];
  if (!validRoles.includes(role)) {
    return NextResponse.json(
      { error: "Role inválido. Use 'gerente' ou 'vendedor'" },
      { status: 400 }
    );
  }

  // Find membership
  let member;
  if (memberId) {
    member = await db.organizationMember.findFirst({
      where: { id: memberId, organizationId: orgId },
    });
  } else if (userId) {
    member = await db.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: orgId,
          userId,
        },
      },
    });
  } else {
    return NextResponse.json(
      { error: "memberId ou userId é obrigatório" },
      { status: 400 }
    );
  }

  if (!member) {
    return NextResponse.json(
      { error: "Membro não encontrado" },
      { status: 404 }
    );
  }

  // Update role
  const updated = await db.organizationMember.update({
    where: { id: member.id },
    data: { role },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return NextResponse.json({
    member: {
      id: updated.id,
      role: updated.role,
      user: updated.user,
    },
  });
}, { requiredPermission: "admin:orgs" });

// DELETE - Remove member from organization (Master only)
export const DELETE = apiHandler(async (req: NextRequest, { params }) => {
  const { id: orgId } = params || {};

  if (!orgId) {
    return NextResponse.json(
      { error: "ID da organização é obrigatório" },
      { status: 400 }
    );
  }

  const { searchParams } = new URL(req.url);
  const memberId = searchParams.get("memberId");
  const userId = searchParams.get("userId");

  // Find membership
  let member;
  if (memberId) {
    member = await db.organizationMember.findFirst({
      where: { id: memberId, organizationId: orgId },
    });
  } else if (userId) {
    member = await db.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: orgId,
          userId,
        },
      },
    });
  } else {
    return NextResponse.json(
      { error: "memberId ou userId é obrigatório" },
      { status: 400 }
    );
  }

  if (!member) {
    return NextResponse.json(
      { error: "Membro não encontrado" },
      { status: 404 }
    );
  }

  // Check if this is the last gerente
  if (member.role === "gerente") {
    const gerenteCount = await db.organizationMember.count({
      where: {
        organizationId: orgId,
        role: "gerente",
      },
    });

    if (gerenteCount <= 1) {
      return NextResponse.json(
        { error: "Não é possível remover o último gerente da organização" },
        { status: 400 }
      );
    }
  }

  // Delete membership
  await db.organizationMember.delete({
    where: { id: member.id },
  });

  return NextResponse.json({ success: true });
}, { requiredPermission: "admin:orgs" });
