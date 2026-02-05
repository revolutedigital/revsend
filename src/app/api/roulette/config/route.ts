import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { getRouletteConfig, updateRouletteConfig, getRouletteStats } from "@/lib/lead-roulette";

// GET - Get roulette configuration and stats
export const GET = apiHandler(async (_req: NextRequest, { session }) => {
  const config = await getRouletteConfig(session!.user.organizationId!);
  const stats = await getRouletteStats(session!.user.organizationId!);

  return NextResponse.json({
    config: config || {
      enabled: false,
      strategy: 'weighted_round_robin',
    },
    stats,
  });
}, { requiredPermission: "roulette:read" });

// PUT - Update roulette configuration
export const PUT = apiHandler(async (req: NextRequest, { session }) => {
  const body = await req.json();
  const { enabled, strategy } = body;

  // Validate strategy
  const validStrategies = ['round_robin', 'weighted_round_robin', 'manual'];
  if (strategy && !validStrategies.includes(strategy)) {
    return NextResponse.json(
      { error: "Estratégia inválida" },
      { status: 400 }
    );
  }

  const config = await updateRouletteConfig(session!.user.organizationId!, {
    enabled,
    strategy,
  });

  return NextResponse.json({ config });
}, { requiredPermission: "roulette:manage" });
