import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { db } from "@/lib/db";

// GET - Get user details (Master only)
export const GET = apiHandler(async (_req: NextRequest, { params }) => {
  const { id } = params || {};

  if (!id) {
    return NextResponse.json(
      { error: "ID do usuário é obrigatório" },
      { status: 400 }
    );
  }

  const user = await db.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      isMaster: true,
      emailVerified: true,
      createdAt: true,
      organizations: {
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
              plan: true,
            },
          },
        },
      },
      _count: {
        select: {
          assignedDeals: true,
          assignedTasks: true,
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json(
      { error: "Usuário não encontrado" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      isMaster: user.isMaster,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      organizations: user.organizations.map((m) => ({
        id: m.organization.id,
        name: m.organization.name,
        slug: m.organization.slug,
        plan: m.organization.plan,
        role: m.role,
        joinedAt: m.createdAt,
      })),
      stats: {
        organizationsCount: user.organizations.length,
        assignedDeals: user._count.assignedDeals,
        assignedTasks: user._count.assignedTasks,
      },
    },
  });
}, { requiredPermission: "admin:users" });

// PUT - Update user (toggle isMaster, etc.) (Master only)
export const PUT = apiHandler(async (req: NextRequest, { params, session }) => {
  const { id } = params || {};

  if (!id) {
    return NextResponse.json(
      { error: "ID do usuário é obrigatório" },
      { status: 400 }
    );
  }

  const body = await req.json();
  const { isMaster, name } = body;

  // Check if user exists
  const existing = await db.user.findUnique({
    where: { id },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Usuário não encontrado" },
      { status: 404 }
    );
  }

  // Prevent self-demotion from master
  if (id === session!.user.id && isMaster === false) {
    return NextResponse.json(
      { error: "Você não pode remover seu próprio status de Master" },
      { status: 400 }
    );
  }

  // Count current masters if demoting someone
  if (isMaster === false && existing.isMaster) {
    const masterCount = await db.user.count({
      where: { isMaster: true },
    });

    if (masterCount <= 1) {
      return NextResponse.json(
        { error: "Deve existir pelo menos um usuário Master no sistema" },
        { status: 400 }
      );
    }
  }

  const user = await db.user.update({
    where: { id },
    data: {
      ...(isMaster !== undefined && { isMaster }),
      ...(name && { name }),
    },
    select: {
      id: true,
      name: true,
      email: true,
      isMaster: true,
    },
  });

  return NextResponse.json({ user });
}, { requiredPermission: "admin:users" });

// DELETE - Delete user (Master only)
export const DELETE = apiHandler(async (_req: NextRequest, { params, session }) => {
  const { id } = params || {};

  if (!id) {
    return NextResponse.json(
      { error: "ID do usuário é obrigatório" },
      { status: 400 }
    );
  }

  // Prevent self-deletion
  if (id === session!.user.id) {
    return NextResponse.json(
      { error: "Você não pode deletar sua própria conta" },
      { status: 400 }
    );
  }

  const existing = await db.user.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          organizations: true,
          assignedDeals: true,
        },
      },
    },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Usuário não encontrado" },
      { status: 404 }
    );
  }

  // Prevent deletion of the last master
  if (existing.isMaster) {
    const masterCount = await db.user.count({
      where: { isMaster: true },
    });

    if (masterCount <= 1) {
      return NextResponse.json(
        { error: "Não é possível deletar o único usuário Master" },
        { status: 400 }
      );
    }
  }

  // Delete user (cascade will handle memberships)
  await db.user.delete({
    where: { id },
  });

  return NextResponse.json({
    success: true,
    message: "Usuário deletado",
  });
}, { requiredPermission: "admin:users" });
