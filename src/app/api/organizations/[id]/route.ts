import { NextRequest, NextResponse } from "next/server";
import { apiHandler, canAccessResource } from "@/lib/api-handler";
import { db } from "@/lib/db";

/**
 * GET /api/organizations/[id]
 * Get organization details
 */
export const GET = apiHandler(
  async (req: NextRequest, { params, session }) => {
    const organization = await db.organization.findUnique({
      where: { id: params!.id },
      include: {
        _count: {
          select: {
            members: true,
            campaigns: true,
            contactLists: true,
            deals: true,
            whatsappNumbers: true,
          },
        },
      },
    });

    if (!organization) {
      return NextResponse.json(
        { error: "Organização não encontrada" },
        { status: 404 }
      );
    }

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

    return NextResponse.json({
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        plan: organization.plan,
        createdAt: organization.createdAt,
        stats: {
          members: organization._count.members,
          campaigns: organization._count.campaigns,
          lists: organization._count.contactLists,
          deals: organization._count.deals,
          whatsappNumbers: organization._count.whatsappNumbers,
        },
      },
    });
  },
  { allowNoOrg: true }
);

/**
 * PUT /api/organizations/[id]
 * Update organization details
 */
export const PUT = apiHandler(
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
      if (!membership || membership.role !== "gerente") {
        return NextResponse.json(
          { error: "Apenas gerentes podem editar a organização" },
          { status: 403 }
        );
      }
    }

    const body = await req.json();
    const { name } = body;

    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length < 2) {
        return NextResponse.json(
          { error: "Nome deve ter pelo menos 2 caracteres" },
          { status: 400 }
        );
      }
    }

    const organization = await db.organization.update({
      where: { id: params!.id },
      data: {
        ...(name && { name: name.trim() }),
      },
    });

    return NextResponse.json({
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        plan: organization.plan,
      },
    });
  },
  { allowNoOrg: true, requiredPermission: "org:update" }
);

/**
 * DELETE /api/organizations/[id]
 * Delete organization (Master only)
 */
export const DELETE = apiHandler(
  async (req: NextRequest, { params, session }) => {
    // Only master can delete organizations
    if (!session!.user.isMaster) {
      return NextResponse.json(
        { error: "Apenas administradores podem excluir organizações" },
        { status: 403 }
      );
    }

    const organization = await db.organization.findUnique({
      where: { id: params!.id },
    });

    if (!organization) {
      return NextResponse.json(
        { error: "Organização não encontrada" },
        { status: 404 }
      );
    }

    await db.organization.delete({
      where: { id: params!.id },
    });

    return NextResponse.json({ success: true });
  },
  { allowNoOrg: true, requiredPermission: "admin:orgs" }
);
