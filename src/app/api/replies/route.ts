import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { db } from "@/lib/db";

export const GET = apiHandler(async (req: NextRequest, { session }) => {
  const { searchParams } = new URL(req.url);
  const campaignId = searchParams.get("campaignId");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");

  const where = {
    campaign: {
      userId: session!.user.id,
    },
    ...(campaignId ? { campaignId } : {}),
  };

  const [replies, total] = await Promise.all([
    db.reply.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { receivedAt: "desc" },
      include: {
        contact: {
          select: {
            name: true,
            phoneNumber: true,
          },
        },
        campaign: {
          select: {
            name: true,
          },
        },
        whatsappNumber: {
          select: {
            name: true,
            phoneNumber: true,
          },
        },
      },
    }),
    db.reply.count({ where }),
  ]);

  return NextResponse.json({
    replies,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});
