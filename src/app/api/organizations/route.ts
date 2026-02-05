import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { db } from "@/lib/db";

/**
 * GET /api/organizations
 * List all organizations the user belongs to
 */
export const GET = apiHandler(
  async (req: NextRequest, { session }) => {
    // Master can see all organizations
    if (session!.user.isMaster) {
      const organizations = await db.organization.findMany({
        orderBy: { name: "asc" },
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

      return NextResponse.json({
        organizations: organizations.map((org) => ({
          id: org.id,
          name: org.name,
          slug: org.slug,
          plan: org.plan,
          role: "master" as const,
          memberCount: org._count.members,
          campaignCount: org._count.campaigns,
          dealCount: org._count.deals,
          createdAt: org.createdAt,
        })),
      });
    }

    // Regular users see only their organizations
    const memberships = await db.organizationMember.findMany({
      where: { userId: session!.user.id },
      include: {
        organization: {
          include: {
            _count: {
              select: {
                members: true,
                campaigns: true,
                deals: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({
      organizations: memberships.map((m) => ({
        id: m.organization.id,
        name: m.organization.name,
        slug: m.organization.slug,
        plan: m.organization.plan,
        role: m.role,
        memberCount: m.organization._count.members,
        campaignCount: m.organization._count.campaigns,
        dealCount: m.organization._count.deals,
        createdAt: m.createdAt,
      })),
    });
  },
  { allowNoOrg: true }
);

/**
 * POST /api/organizations
 * Create a new organization
 */
export const POST = apiHandler(
  async (req: NextRequest, { session }) => {
    const body = await req.json();
    const { name } = body;

    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json(
        { error: "Nome da organização deve ter pelo menos 2 caracteres" },
        { status: 400 }
      );
    }

    // Generate slug
    let slug = name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .substring(0, 50);

    // Ensure unique slug
    let slugSuffix = 0;
    let finalSlug = slug;
    while (true) {
      const existing = await db.organization.findUnique({
        where: { slug: finalSlug },
      });
      if (!existing) break;
      slugSuffix++;
      finalSlug = `${slug}-${slugSuffix}`;
    }

    // Create organization and add creator as gerente
    const organization = await db.organization.create({
      data: {
        name: name.trim(),
        slug: finalSlug,
        plan: "free",
        members: {
          create: {
            userId: session!.user.id,
            role: "gerente",
          },
        },
      },
      include: {
        _count: {
          select: { members: true },
        },
      },
    });

    // Create default blacklist keywords for LGPD compliance
    const defaultKeywords = [
      "pare",
      "parar",
      "sair",
      "cancelar",
      "remover",
      "stop",
      "não quero",
    ];
    await db.blacklistKeyword.createMany({
      data: defaultKeywords.map((keyword) => ({
        organizationId: organization.id,
        keyword,
      })),
    });

    // Create default pipeline stages
    const defaultStages = [
      { name: "Novo", color: "#3B82F6", orderIndex: 0 },
      { name: "Qualificação", color: "#8B5CF6", orderIndex: 1 },
      { name: "Proposta", color: "#F59E0B", orderIndex: 2 },
      { name: "Negociação", color: "#EC4899", orderIndex: 3 },
      { name: "Ganho", color: "#10B981", orderIndex: 4, isFinal: true, isWon: true },
      { name: "Perdido", color: "#EF4444", orderIndex: 5, isFinal: true, isWon: false },
    ];
    await db.pipelineStage.createMany({
      data: defaultStages.map((stage) => ({
        organizationId: organization.id,
        userId: session!.user.id,
        ...stage,
      })),
    });

    // Create lead roulette config (disabled by default)
    await db.leadRouletteConfig.create({
      data: {
        organizationId: organization.id,
        enabled: false,
        strategy: "weighted_round_robin",
      },
    });

    return NextResponse.json({
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        plan: organization.plan,
        role: "gerente",
        memberCount: organization._count.members,
      },
    });
  },
  { allowNoOrg: true }
);
