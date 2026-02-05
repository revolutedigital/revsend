import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { assignLead, getNextAssignee } from "@/lib/lead-roulette";
import { db } from "@/lib/db";

// GET - Preview who would be assigned next (without actually assigning)
export const GET = apiHandler(async (_req: NextRequest, { session }) => {
  const nextAssignee = await getNextAssignee(session!.user.organizationId!);

  if (!nextAssignee) {
    return NextResponse.json({
      nextAssignee: null,
      message: "Roleta desativada ou nenhum usuário disponível",
    });
  }

  // Get user info
  const user = await db.user.findUnique({
    where: { id: nextAssignee },
    select: { id: true, name: true, email: true },
  });

  return NextResponse.json({
    nextAssignee: user,
  });
}, { requiredPermission: "roulette:read" });

// POST - Assign a deal to the next user
export const POST = apiHandler(async (req: NextRequest, { session }) => {
  const body = await req.json();
  const { dealId } = body;

  if (!dealId) {
    return NextResponse.json(
      { error: "dealId é obrigatório" },
      { status: 400 }
    );
  }

  // Verify deal exists and belongs to organization
  const deal = await db.deal.findFirst({
    where: {
      id: dealId,
      organizationId: session!.user.organizationId!,
    },
  });

  if (!deal) {
    return NextResponse.json(
      { error: "Negócio não encontrado" },
      { status: 404 }
    );
  }

  // Assign lead
  const assigneeId = await assignLead(session!.user.organizationId!, dealId);

  if (!assigneeId) {
    return NextResponse.json({
      success: false,
      message: "Roleta desativada ou nenhum usuário disponível",
    });
  }

  // Get assigned user info
  const assignee = await db.user.findUnique({
    where: { id: assigneeId },
    select: { id: true, name: true, email: true },
  });

  return NextResponse.json({
    success: true,
    assignee,
    dealId,
  });
}, { requiredPermission: "deals:assign" });
