import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { db } from "@/lib/db";

// GET - Get dashboard data based on role
export const GET = apiHandler(async (_req: NextRequest, { session }) => {
  const { role, organizationId, id: userId, isMaster } = session!.user;

  // For Master without selected org, show global stats
  if (isMaster && !organizationId) {
    return NextResponse.json(await getMasterGlobalDashboard());
  }

  // For Master with selected org or Gerente, show full org stats
  if (role === "master" || role === "gerente") {
    return NextResponse.json(await getGerenteDashboard(organizationId!));
  }

  // For Vendedor, show personal stats only
  return NextResponse.json(await getVendedorDashboard(organizationId!, userId));
}, { requiredPermission: "org:read" });

/**
 * Master global dashboard - stats across all organizations
 */
async function getMasterGlobalDashboard() {
  const [
    totalOrgs,
    totalUsers,
    totalCampaigns,
    totalDeals,
    recentOrgs,
  ] = await Promise.all([
    db.organization.count(),
    db.user.count(),
    db.campaign.count(),
    db.deal.count(),
    db.organization.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        _count: {
          select: {
            members: true,
            campaigns: true,
          },
        },
      },
    }),
  ]);

  // Get campaign stats by status
  const campaignsByStatus = await db.campaign.groupBy({
    by: ["status"],
    _count: true,
  });

  return {
    type: "master_global",
    stats: {
      totalOrgs,
      totalUsers,
      totalCampaigns,
      totalDeals,
    },
    campaignsByStatus: campaignsByStatus.reduce((acc, item) => {
      acc[item.status] = item._count;
      return acc;
    }, {} as Record<string, number>),
    recentOrgs: recentOrgs.map((org) => ({
      id: org.id,
      name: org.name,
      plan: org.plan,
      membersCount: org._count.members,
      campaignsCount: org._count.campaigns,
      createdAt: org.createdAt,
    })),
  };
}

/**
 * Gerente/Manager dashboard - full organization stats
 */
async function getGerenteDashboard(organizationId: string) {
  const [
    totalCampaigns,
    activeCampaigns,
    totalContacts,
    totalDeals,
    totalReplies,
    totalSent,
    members,
    recentCampaigns,
    dealsByStage,
    leadsByStatus,
  ] = await Promise.all([
    // Campaign counts
    db.campaign.count({ where: { organizationId } }),
    db.campaign.count({ where: { organizationId, status: "running" } }),

    // Contact count
    db.contact.count({
      where: { list: { organizationId } },
    }),

    // Deal count
    db.deal.count({ where: { organizationId } }),

    // Reply count
    db.reply.count({
      where: { campaign: { organizationId } },
    }),

    // Sent messages count
    db.sentMessage.count({
      where: { campaign: { organizationId }, status: "sent" },
    }),

    // Team members
    db.organizationMember.findMany({
      where: { organizationId },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    }),

    // Recent campaigns
    db.campaign.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        status: true,
        totalSent: true,
        totalReplies: true,
        createdAt: true,
      },
    }),

    // Deals by stage
    db.deal.groupBy({
      by: ["stageId"],
      where: { organizationId },
      _count: true,
      _sum: { value: true },
    }),

    // Leads by status
    db.contact.groupBy({
      by: ["leadStatus"],
      where: { list: { organizationId }, leadStatus: { not: null } },
      _count: true,
    }),
  ]);

  // Get stage names
  const stages = await db.pipelineStage.findMany({
    where: { organizationId },
    select: { id: true, name: true, color: true },
  });

  const stageMap = new Map(stages.map((s) => [s.id, s]));

  // Get member stats (deals assigned)
  const memberStats = await db.deal.groupBy({
    by: ["assignedToId"],
    where: { organizationId, assignedToId: { not: null } },
    _count: true,
    _sum: { value: true },
  });

  const memberStatsMap = new Map(memberStats.map((s) => [s.assignedToId, s]));

  return {
    type: "gerente",
    stats: {
      totalCampaigns,
      activeCampaigns,
      totalContacts,
      totalDeals,
      totalReplies,
      totalSent,
      responseRate: totalSent > 0 ? ((totalReplies / totalSent) * 100).toFixed(1) + "%" : "0%",
    },
    team: members.map((m) => {
      const stats = memberStatsMap.get(m.userId);
      return {
        id: m.userId,
        name: m.user.name,
        email: m.user.email,
        role: m.role,
        dealsCount: stats?._count || 0,
        dealsValue: stats?._sum.value || 0,
      };
    }),
    recentCampaigns,
    pipeline: dealsByStage.map((d) => {
      const stage = stageMap.get(d.stageId);
      return {
        stageId: d.stageId,
        stageName: stage?.name || "Unknown",
        stageColor: stage?.color || "#gray",
        count: d._count,
        totalValue: d._sum.value || 0,
      };
    }),
    leadsByStatus: leadsByStatus.reduce((acc, item) => {
      if (item.leadStatus) {
        acc[item.leadStatus] = item._count;
      }
      return acc;
    }, {} as Record<string, number>),
  };
}

/**
 * Vendedor/Salesperson dashboard - personal stats only
 */
async function getVendedorDashboard(organizationId: string, userId: string) {
  const [
    myDeals,
    myDealsWon,
    myDealsLost,
    myTasks,
    myPendingTasks,
    recentDeals,
    dealsByStage,
    upcomingTasks,
  ] = await Promise.all([
    // My deals count
    db.deal.count({
      where: { organizationId, assignedToId: userId },
    }),

    // Won deals
    db.deal.count({
      where: {
        organizationId,
        assignedToId: userId,
        stage: { isWon: true },
      },
    }),

    // Lost deals
    db.deal.count({
      where: {
        organizationId,
        assignedToId: userId,
        stage: { isFinal: true, isWon: false },
      },
    }),

    // My tasks count
    db.dealTask.count({
      where: { organizationId, assignedToId: userId },
    }),

    // Pending tasks
    db.dealTask.count({
      where: { organizationId, assignedToId: userId, completedAt: null },
    }),

    // Recent deals
    db.deal.findMany({
      where: { organizationId, assignedToId: userId },
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: {
        stage: { select: { name: true, color: true } },
        contact: { select: { name: true, phoneNumber: true } },
      },
    }),

    // My deals by stage
    db.deal.groupBy({
      by: ["stageId"],
      where: { organizationId, assignedToId: userId },
      _count: true,
      _sum: { value: true },
    }),

    // Upcoming tasks
    db.dealTask.findMany({
      where: {
        organizationId,
        assignedToId: userId,
        completedAt: null,
        dueDate: { gte: new Date() },
      },
      orderBy: { dueDate: "asc" },
      take: 5,
      include: {
        deal: { select: { id: true, title: true } },
      },
    }),
  ]);

  // Get total value of my deals
  const totalValue = await db.deal.aggregate({
    where: { organizationId, assignedToId: userId },
    _sum: { value: true },
  });

  // Get stages
  const stages = await db.pipelineStage.findMany({
    where: { organizationId },
    select: { id: true, name: true, color: true },
  });

  const stageMap = new Map(stages.map((s) => [s.id, s]));

  return {
    type: "vendedor",
    stats: {
      myDeals,
      myDealsWon,
      myDealsLost,
      myTasks,
      myPendingTasks,
      totalValue: totalValue._sum.value || 0,
      winRate: myDeals > 0 ? ((myDealsWon / myDeals) * 100).toFixed(1) + "%" : "0%",
    },
    recentDeals: recentDeals.map((d) => ({
      id: d.id,
      title: d.title,
      value: d.value,
      stage: d.stage,
      contact: d.contact,
      updatedAt: d.updatedAt,
    })),
    pipeline: dealsByStage.map((d) => {
      const stage = stageMap.get(d.stageId);
      return {
        stageId: d.stageId,
        stageName: stage?.name || "Unknown",
        stageColor: stage?.color || "#gray",
        count: d._count,
        totalValue: d._sum.value || 0,
      };
    }),
    upcomingTasks: upcomingTasks.map((t) => ({
      id: t.id,
      title: t.title,
      dueDate: t.dueDate,
      deal: t.deal,
    })),
  };
}
