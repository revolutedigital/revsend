import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { db } from "@/lib/db";

/**
 * POST /api/auth/switch-org
 * Switch the user's active organization
 * Client should call update() from next-auth after this to refresh the session
 */
export const POST = apiHandler(
  async (req: NextRequest, { session }) => {
    const body = await req.json();
    const { organizationId } = body;

    if (!organizationId) {
      return NextResponse.json(
        { error: "organizationId é obrigatório" },
        { status: 400 }
      );
    }

    // Check if organization exists
    const organization = await db.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      return NextResponse.json(
        { error: "Organização não encontrada" },
        { status: 404 }
      );
    }

    // Master can switch to any org
    if (session!.user.isMaster) {
      // Get role if user is also a member
      const membership = await db.organizationMember.findUnique({
        where: {
          organizationId_userId: {
            organizationId,
            userId: session!.user.id,
          },
        },
      });

      return NextResponse.json({
        success: true,
        organization: {
          id: organization.id,
          name: organization.name,
          slug: organization.slug,
        },
        role: membership?.role || null,
        // Client should use this to update session:
        // await update({ currentOrgId: organizationId })
      });
    }

    // Regular user - check membership
    const membership = await db.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId: session!.user.id,
        },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "Você não é membro desta organização" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
      },
      role: membership.role,
    });
  },
  { allowNoOrg: true }
);
