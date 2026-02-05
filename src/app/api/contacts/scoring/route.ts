import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { getScoringStats, bulkScoreContacts } from "@/lib/lead-scoring";

// GET - Get scoring statistics for organization
export const GET = apiHandler(async (_req: NextRequest, { session }) => {
  const stats = await getScoringStats(session!.user.organizationId!);

  return NextResponse.json({ stats });
}, { requiredPermission: "contacts:read" });

// POST - Bulk score unscored contacts
export const POST = apiHandler(async (_req: NextRequest, { session }) => {
  const scoredCount = await bulkScoreContacts(session!.user.organizationId!);

  return NextResponse.json({
    message: `${scoredCount} contatos foram pontuados`,
    scoredCount,
  });
}, { requiredPermission: "contacts:update" });
