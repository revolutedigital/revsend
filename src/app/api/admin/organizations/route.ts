import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { db } from "@/lib/db";

// GET - List all organizations (Master only)
export const GET = apiHandler(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
  const search = searchParams.get("search") || "";
  const plan = searchParams.get("plan") || "";

  const where = {
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { slug: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(plan ? { plan } : {}),
  };

  const [organizations, total] = await Promise.all([
    db.organization.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        _count: {
          select: {
            members: true,
            campaigns: true,
            deals: true,
          },
        },
      },
    }),
    db.organization.count({ where }),
  ]);

  return NextResponse.json({
    organizations: organizations.map((org) => ({
      id: org.id,
      name: org.name,
      slug: org.slug,
      plan: org.plan,
      membersCount: org._count.members,
      campaignsCount: org._count.campaigns,
      dealsCount: org._count.deals,
      createdAt: org.createdAt,
      updatedAt: org.updatedAt,
    })),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
}, { requiredPermission: "admin:orgs" });

// POST - Create a new organization (Master only)
export const POST = apiHandler(async (req: NextRequest, { session }) => {
  const body = await req.json();
  const { name, slug, plan = "free", ownerEmail } = body;

  if (!name || !slug) {
    return NextResponse.json(
      { error: "Nome e slug são obrigatórios" },
      { status: 400 }
    );
  }

  // Check if slug is unique
  const existing = await db.organization.findUnique({
    where: { slug },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Já existe uma organização com este slug" },
      { status: 400 }
    );
  }

  // Find owner if email provided
  let ownerId = session!.user.id;
  if (ownerEmail) {
    const owner = await db.user.findUnique({ where: { email: ownerEmail } });
    if (!owner) {
      return NextResponse.json(
        { error: "Usuário owner não encontrado" },
        { status: 404 }
      );
    }
    ownerId = owner.id;
  }

  // Create organization with owner as gerente
  const organization = await db.organization.create({
    data: {
      name,
      slug,
      plan,
      members: {
        create: {
          userId: ownerId,
          role: "gerente",
        },
      },
    },
    include: {
      members: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });

  // Create default pipeline stages
  await db.pipelineStage.createMany({
    data: [
      { organizationId: organization.id, userId: ownerId, name: "Novo", color: "#6B7280", orderIndex: 0 },
      { organizationId: organization.id, userId: ownerId, name: "Qualificação", color: "#3B82F6", orderIndex: 1 },
      { organizationId: organization.id, userId: ownerId, name: "Proposta", color: "#F59E0B", orderIndex: 2 },
      { organizationId: organization.id, userId: ownerId, name: "Negociação", color: "#8B5CF6", orderIndex: 3 },
      { organizationId: organization.id, userId: ownerId, name: "Fechado (Ganho)", color: "#10B981", orderIndex: 4, isFinal: true, isWon: true },
      { organizationId: organization.id, userId: ownerId, name: "Perdido", color: "#EF4444", orderIndex: 5, isFinal: true, isWon: false },
    ],
  });

  return NextResponse.json({ organization }, { status: 201 });
}, { requiredPermission: "admin:orgs" });
