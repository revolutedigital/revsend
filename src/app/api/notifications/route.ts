import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { db } from "@/lib/db";

// GET - List notifications for user
export const GET = apiHandler(async (req: NextRequest, { session }) => {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
  const unreadOnly = searchParams.get("unreadOnly") === "true";
  const type = searchParams.get("type");

  const where = {
    userId: session!.user.id,
    organizationId: session!.user.organizationId!,
    ...(unreadOnly ? { read: false } : {}),
    ...(type ? { type } : {}),
  };

  const [notifications, total] = await Promise.all([
    db.notification.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        type: true,
        title: true,
        message: true,
        metadata: true,
        read: true,
        readAt: true,
        createdAt: true,
      },
    }),
    db.notification.count({ where }),
  ]);

  return NextResponse.json({
    notifications,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
}, { requiredPermission: "notifications:read" });

// PUT - Mark notifications as read
export const PUT = apiHandler(async (req: NextRequest, { session }) => {
  const body = await req.json();
  const { ids, markAll } = body as { ids?: string[]; markAll?: boolean };

  const now = new Date();

  if (markAll) {
    // Mark all unread notifications as read
    const result = await db.notification.updateMany({
      where: {
        userId: session!.user.id,
        organizationId: session!.user.organizationId!,
        read: false,
      },
      data: {
        read: true,
        readAt: now,
      },
    });

    return NextResponse.json({
      success: true,
      updated: result.count,
    });
  }

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json(
      { error: "IDs de notificações são obrigatórios" },
      { status: 400 }
    );
  }

  // Mark specific notifications as read
  const result = await db.notification.updateMany({
    where: {
      id: { in: ids },
      userId: session!.user.id,
      organizationId: session!.user.organizationId!,
      read: false,
    },
    data: {
      read: true,
      readAt: now,
    },
  });

  return NextResponse.json({
    success: true,
    updated: result.count,
  });
}, { requiredPermission: "notifications:read" });
