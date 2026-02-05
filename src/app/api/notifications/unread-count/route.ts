import { NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { db } from "@/lib/db";

// GET - Count unread notifications for user
export const GET = apiHandler(async (_req, { session }) => {
  const count = await db.notification.count({
    where: {
      userId: session!.user.id,
      organizationId: session!.user.organizationId!,
      read: false,
    },
  });

  return NextResponse.json({ count });
}, { requiredPermission: "notifications:read" });
