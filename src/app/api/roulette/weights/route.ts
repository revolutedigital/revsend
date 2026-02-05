import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { getUserWeights, setUserWeight, deleteUserWeight } from "@/lib/lead-roulette";

// GET - Get all user weights
export const GET = apiHandler(async (_req: NextRequest, { session }) => {
  const weights = await getUserWeights(session!.user.organizationId!);

  return NextResponse.json({ weights });
}, { requiredPermission: "roulette:read" });

// POST - Set or update a user's weight
export const POST = apiHandler(async (req: NextRequest, { session }) => {
  const body = await req.json();
  const { userId, weight, isActive } = body;

  if (!userId) {
    return NextResponse.json(
      { error: "userId é obrigatório" },
      { status: 400 }
    );
  }

  if (weight !== undefined && (typeof weight !== 'number' || weight < 0 || weight > 100)) {
    return NextResponse.json(
      { error: "Peso deve ser um número entre 0 e 100" },
      { status: 400 }
    );
  }

  try {
    await setUserWeight(
      session!.user.organizationId!,
      userId,
      weight ?? 1,
      isActive ?? true
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao atualizar peso";
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}, { requiredPermission: "roulette:manage" });

// PUT - Bulk update weights
export const PUT = apiHandler(async (req: NextRequest, { session }) => {
  const body = await req.json();
  const { weights } = body;

  if (!Array.isArray(weights)) {
    return NextResponse.json(
      { error: "weights deve ser um array" },
      { status: 400 }
    );
  }

  const errors: string[] = [];

  for (const w of weights) {
    if (!w.userId) {
      errors.push("userId ausente em um item");
      continue;
    }

    if (w.weight !== undefined && (typeof w.weight !== 'number' || w.weight < 0 || w.weight > 100)) {
      errors.push(`Peso inválido para usuário ${w.userId}`);
      continue;
    }

    try {
      await setUserWeight(
        session!.user.organizationId!,
        w.userId,
        w.weight ?? 1,
        w.isActive ?? true
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro";
      errors.push(`${w.userId}: ${message}`);
    }
  }

  if (errors.length > 0) {
    return NextResponse.json(
      { success: false, errors },
      { status: 207 } // Multi-Status
    );
  }

  return NextResponse.json({ success: true });
}, { requiredPermission: "roulette:manage" });

// DELETE - Delete a user's weight (reset to default)
export const DELETE = apiHandler(async (req: NextRequest, { session }) => {
  const body = await req.json();
  const { userId } = body;

  if (!userId) {
    return NextResponse.json(
      { error: "userId é obrigatório" },
      { status: 400 }
    );
  }

  await deleteUserWeight(session!.user.organizationId!, userId);

  return NextResponse.json({ success: true });
}, { requiredPermission: "roulette:manage" });
