import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { db } from "@/lib/db";

// GET - Get organization details (Master only)
export const GET = apiHandler(async (_req: NextRequest, { params }) => {
  const { id } = params || {};

  if (!id) {
    return NextResponse.json(
      { error: "ID da organização é obrigatório" },
      { status: 400 }
    );
  }

  const organization = await db.organization.findUnique({
    where: { id },
    include: {
      members: {
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
      },
      _count: {
        select: {
          campaigns: true,
          contactLists: true,
          deals: true,
          templates: true,
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

  // Get additional stats
  const [activeCampaigns, totalContacts, totalMessages] = await Promise.all([
    db.campaign.count({
      where: { organizationId: id, status: "in_progress" },
    }),
    db.contact.count({
      where: { list: { organizationId: id } },
    }),
    db.sentMessage.count({
      where: { campaign: { organizationId: id } },
    }),
  ]);

  return NextResponse.json({
    organization: {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      plan: organization.plan,
      createdAt: organization.createdAt,
      updatedAt: organization.updatedAt,
      members: organization.members.map((m) => ({
        id: m.id,
        role: m.role,
        joinedAt: m.createdAt,
        user: m.user,
      })),
      stats: {
        membersCount: organization.members.length,
        campaignsCount: organization._count.campaigns,
        activeCampaigns,
        listsCount: organization._count.contactLists,
        dealsCount: organization._count.deals,
        templatesCount: organization._count.templates,
        whatsappNumbersCount: organization._count.whatsappNumbers,
        totalContacts,
        totalMessages,
      },
    },
  });
}, { requiredPermission: "admin:orgs" });

// PUT - Update organization (Master only)
export const PUT = apiHandler(async (req: NextRequest, { params }) => {
  const { id } = params || {};

  if (!id) {
    return NextResponse.json(
      { error: "ID da organização é obrigatório" },
      { status: 400 }
    );
  }

  const body = await req.json();
  const { name, slug, plan } = body;

  // Check if organization exists
  const existing = await db.organization.findUnique({
    where: { id },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Organização não encontrada" },
      { status: 404 }
    );
  }

  // If changing slug, check uniqueness
  if (slug && slug !== existing.slug) {
    const slugExists = await db.organization.findUnique({
      where: { slug },
    });

    if (slugExists) {
      return NextResponse.json(
        { error: "Já existe uma organização com este slug" },
        { status: 400 }
      );
    }
  }

  const organization = await db.organization.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(slug && { slug }),
      ...(plan && { plan }),
    },
  });

  return NextResponse.json({ organization });
}, { requiredPermission: "admin:orgs" });

// DELETE - Delete organization (Master only)
export const DELETE = apiHandler(async (_req: NextRequest, { params }) => {
  const { id } = params || {};

  if (!id) {
    return NextResponse.json(
      { error: "ID da organização é obrigatório" },
      { status: 400 }
    );
  }

  // Check if organization exists
  const existing = await db.organization.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          members: true,
          campaigns: true,
          deals: true,
        },
      },
    },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Organização não encontrada" },
      { status: 404 }
    );
  }

  // Safety check - warn if org has significant data
  const hasData = existing._count.campaigns > 0 || existing._count.deals > 0;

  // Delete organization (cascades to related data)
  await db.organization.delete({
    where: { id },
  });

  return NextResponse.json({
    success: true,
    message: hasData
      ? "Organização e todos os dados relacionados foram deletados"
      : "Organização deletada",
  });
}, { requiredPermission: "admin:orgs" });
