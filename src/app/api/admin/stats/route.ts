import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { db } from "@/lib/db";

// GET - Get admin statistics (Master only)
export const GET = apiHandler(async (_req: NextRequest) => {
  const [
    totalOrgs,
    totalUsers,
    totalMasters,
    totalCampaigns,
    activeCampaigns,
    totalDeals,
    totalContacts,
    totalSentMessages,
    totalReplies,
    orgsByPlan,
    recentActivity,
  ] = await Promise.all([
    db.organization.count(),
    db.user.count(),
    db.user.count({ where: { isMaster: true } }),
    db.campaign.count(),
    db.campaign.count({ where: { status: "running" } }),
    db.deal.count(),
    db.contact.count(),
    db.sentMessage.count({ where: { status: "sent" } }),
    db.reply.count(),

    // Organizations by plan
    db.organization.groupBy({
      by: ["plan"],
      _count: true,
    }),

    // Recent audit logs
    db.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        user: { select: { id: true, name: true, email: true } },
        organization: { select: { id: true, name: true } },
      },
    }),
  ]);

  // Get growth stats (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [newOrgs, newUsers, newCampaigns] = await Promise.all([
    db.organization.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    db.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    db.campaign.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
  ]);

  return NextResponse.json({
    overview: {
      totalOrgs,
      totalUsers,
      totalMasters,
      totalCampaigns,
      activeCampaigns,
      totalDeals,
      totalContacts,
      totalSentMessages,
      totalReplies,
      responseRate: totalSentMessages > 0
        ? ((totalReplies / totalSentMessages) * 100).toFixed(1) + "%"
        : "0%",
    },
    growth: {
      newOrgsLast30Days: newOrgs,
      newUsersLast30Days: newUsers,
      newCampaignsLast30Days: newCampaigns,
    },
    orgsByPlan: orgsByPlan.reduce((acc, item) => {
      acc[item.plan] = item._count;
      return acc;
    }, {} as Record<string, number>),
    recentActivity: recentActivity.map((log) => ({
      id: log.id,
      action: log.action,
      resource: log.resource,
      resourceId: log.resourceId,
      user: log.user,
      organization: log.organization,
      createdAt: log.createdAt,
    })),
  });
}, { requiredPermission: "admin:access" });
