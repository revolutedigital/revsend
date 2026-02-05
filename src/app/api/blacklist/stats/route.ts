import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { getBlacklistStats } from "@/lib/lgpd";

// GET - Get blacklist statistics for organization
export const GET = apiHandler(async (_req: NextRequest, { session }) => {
  const stats = await getBlacklistStats(session!.user.organizationId!);

  return NextResponse.json({ stats });
}, { requiredPermission: "blacklist:read" });
