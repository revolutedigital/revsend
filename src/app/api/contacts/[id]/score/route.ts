import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { db } from "@/lib/db";
import { scoreContact, scoreFromReply } from "@/lib/lead-scoring";

// GET - Get contact's current score and metadata
export const GET = apiHandler(async (_req: NextRequest, { params, session }) => {
  // Verify contact belongs to organization
  const contact = await db.contact.findFirst({
    where: {
      id: params?.id,
      list: { organizationId: session!.user.organizationId! },
    },
    select: {
      id: true,
      name: true,
      phoneNumber: true,
      leadScore: true,
      leadStatus: true,
      scoredAt: true,
      scoreMetadata: true,
    },
  });

  if (!contact) {
    return NextResponse.json(
      { error: "Contato não encontrado" },
      { status: 404 }
    );
  }

  return NextResponse.json({ contact });
}, { requiredPermission: "contacts:read" });

// POST - Score or re-score a contact
export const POST = apiHandler(async (req: NextRequest, { params, session }) => {
  const body = await req.json();
  const { replyText } = body;

  // Verify contact belongs to organization
  const contact = await db.contact.findFirst({
    where: {
      id: params?.id,
      list: { organizationId: session!.user.organizationId! },
    },
  });

  if (!contact) {
    return NextResponse.json(
      { error: "Contato não encontrado" },
      { status: 404 }
    );
  }

  // If replyText provided, do quick scoring from that reply
  // Otherwise, do full scoring based on all history
  let result;
  if (replyText) {
    result = await scoreFromReply(params!.id, replyText);
  } else {
    result = await scoreContact(params!.id);
  }

  return NextResponse.json({
    score: result.score,
    status: result.status,
    metadata: 'metadata' in result ? result.metadata : null,
  });
}, { requiredPermission: "contacts:update" });
