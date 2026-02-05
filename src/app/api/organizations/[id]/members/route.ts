import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { db } from "@/lib/db";

/**
 * GET /api/organizations/[id]/members
 * List organization members
 */
export const GET = apiHandler(
  async (req: NextRequest, { params, session }) => {
    // Check access
    if (!session!.user.isMaster) {
      const membership = await db.organizationMember.findUnique({
        where: {
          organizationId_userId: {
            organizationId: params!.id,
            userId: session!.user.id,
          },
        },
      });
      if (!membership) {
        return NextResponse.json(
          { error: "Você não tem acesso a esta organização" },
          { status: 403 }
        );
      }
    }

    const members = await db.organizationMember.findMany({
      where: { organizationId: params!.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
          },
        },
      },
      orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    });

    return NextResponse.json({
      members: members.map((m) => ({
        id: m.id,
        userId: m.userId,
        name: m.user.name,
        email: m.user.email,
        role: m.role,
        joinedAt: m.createdAt,
      })),
    });
  },
  { allowNoOrg: true, requiredPermission: "members:read" }
);

/**
 * POST /api/organizations/[id]/members
 * Add a member to organization (by email)
 */
export const POST = apiHandler(
  async (req: NextRequest, { params, session }) => {
    // Check access - only gerente can add members
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
          { error: "Apenas gerentes podem adicionar membros" },
          { status: 403 }
        );
      }
    }

    const body = await req.json();
    const { email, role = "vendedor" } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email é obrigatório" },
        { status: 400 }
      );
    }

    if (!["gerente", "vendedor"].includes(role)) {
      return NextResponse.json(
        { error: "Role inválido. Use 'gerente' ou 'vendedor'" },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado. O usuário precisa ter uma conta primeiro." },
        { status: 404 }
      );
    }

    // Check if already member
    const existingMembership = await db.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: params!.id,
          userId: user.id,
        },
      },
    });

    if (existingMembership) {
      return NextResponse.json(
        { error: "Este usuário já é membro da organização" },
        { status: 400 }
      );
    }

    // Add member
    const membership = await db.organizationMember.create({
      data: {
        organizationId: params!.id,
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

    // Add to lead roulette if vendedor
    if (role === "vendedor") {
      const rouletteConfig = await db.leadRouletteConfig.findUnique({
        where: { organizationId: params!.id },
      });
      if (rouletteConfig) {
        await db.leadRouletteWeight.create({
          data: {
            rouletteId: rouletteConfig.id,
            userId: user.id,
            weight: 1,
            active: true,
          },
        });
      }
    }

    // Create notification for the added user
    await db.notification.create({
      data: {
        organizationId: params!.id,
        userId: user.id,
        type: "member_joined",
        title: "Bem-vindo à equipe!",
        message: `Você foi adicionado à organização como ${role === "gerente" ? "Gerente" : "Vendedor"}.`,
        metadata: {
          addedBy: session!.user.id,
          role,
        },
      },
    });

    return NextResponse.json({
      member: {
        id: membership.id,
        userId: membership.userId,
        name: membership.user.name,
        email: membership.user.email,
        role: membership.role,
        joinedAt: membership.createdAt,
      },
    });
  },
  { allowNoOrg: true, requiredPermission: "members:manage" }
);

/**
 * PUT /api/organizations/[id]/members
 * Update member role
 */
export const PUT = apiHandler(
  async (req: NextRequest, { params, session }) => {
    // Check access - only gerente can update members
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
          { error: "Apenas gerentes podem atualizar membros" },
          { status: 403 }
        );
      }
    }

    const body = await req.json();
    const { userId, role } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "userId é obrigatório" },
        { status: 400 }
      );
    }

    if (!["gerente", "vendedor"].includes(role)) {
      return NextResponse.json(
        { error: "Role inválido. Use 'gerente' ou 'vendedor'" },
        { status: 400 }
      );
    }

    // Can't change own role
    if (userId === session!.user.id) {
      return NextResponse.json(
        { error: "Você não pode alterar seu próprio papel" },
        { status: 400 }
      );
    }

    const membership = await db.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: params!.id,
          userId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "Membro não encontrado" },
        { status: 404 }
      );
    }

    // Update member
    const updated = await db.organizationMember.update({
      where: { id: membership.id },
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

    // Update roulette config
    const rouletteConfig = await db.leadRouletteConfig.findUnique({
      where: { organizationId: params!.id },
    });
    if (rouletteConfig) {
      if (role === "vendedor") {
        // Add to roulette if not exists
        await db.leadRouletteWeight.upsert({
          where: {
            rouletteId_userId: {
              rouletteId: rouletteConfig.id,
              userId,
            },
          },
          create: {
            rouletteId: rouletteConfig.id,
            userId,
            weight: 1,
            active: true,
          },
          update: {},
        });
      } else {
        // Remove from roulette if gerente
        await db.leadRouletteWeight.deleteMany({
          where: {
            rouletteId: rouletteConfig.id,
            userId,
          },
        });
      }
    }

    return NextResponse.json({
      member: {
        id: updated.id,
        userId: updated.userId,
        name: updated.user.name,
        email: updated.user.email,
        role: updated.role,
      },
    });
  },
  { allowNoOrg: true, requiredPermission: "members:manage" }
);

/**
 * DELETE /api/organizations/[id]/members
 * Remove a member from organization
 */
export const DELETE = apiHandler(
  async (req: NextRequest, { params, session }) => {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId é obrigatório" },
        { status: 400 }
      );
    }

    // Check access - only gerente can remove members
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
          { error: "Apenas gerentes podem remover membros" },
          { status: 403 }
        );
      }
    }

    // Can't remove yourself
    if (userId === session!.user.id) {
      return NextResponse.json(
        { error: "Você não pode se remover da organização" },
        { status: 400 }
      );
    }

    const membership = await db.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: params!.id,
          userId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "Membro não encontrado" },
        { status: 404 }
      );
    }

    // Check if this is the last gerente
    if (membership.role === "gerente") {
      const gerenteCount = await db.organizationMember.count({
        where: {
          organizationId: params!.id,
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

    // Remove member
    await db.organizationMember.delete({
      where: { id: membership.id },
    });

    // Remove from roulette
    const rouletteConfig = await db.leadRouletteConfig.findUnique({
      where: { organizationId: params!.id },
    });
    if (rouletteConfig) {
      await db.leadRouletteWeight.deleteMany({
        where: {
          rouletteId: rouletteConfig.id,
          userId,
        },
      });
    }

    return NextResponse.json({ success: true });
  },
  { allowNoOrg: true, requiredPermission: "members:manage" }
);
