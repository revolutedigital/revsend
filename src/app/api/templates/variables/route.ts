import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import {
  getAvailableVariables,
  resolveTemplateVariables,
  validateTemplate,
  extractVariables,
} from "@/lib/template-variables";

// GET - List available template variables
export const GET = apiHandler(async (_req: NextRequest) => {
  const variables = getAvailableVariables();
  return NextResponse.json({ variables });
}, { requiredPermission: "templates:read" });

// POST - Preview template with sample data or validate
export const POST = apiHandler(async (req: NextRequest, { session }) => {
  const body = await req.json();
  const { template, action = "preview" } = body;

  if (!template) {
    return NextResponse.json(
      { error: "Template é obrigatório" },
      { status: 400 }
    );
  }

  if (action === "validate") {
    // Just validate the template
    const validation = validateTemplate(template);
    const variables = extractVariables(template);

    return NextResponse.json({
      valid: validation.valid,
      warnings: validation.warnings,
      variables,
    });
  }

  // Preview with sample data
  const sampleContext = {
    contact: {
      name: "João Silva",
      phoneNumber: "+5511999999999",
      email: "joao@exemplo.com",
      customFields: {
        empresa: "Tech Corp",
        cargo: "Gerente",
      },
    },
    organization: {
      name: session?.user.name || "Minha Empresa",
    },
    campaign: {
      name: "Campanha Exemplo",
    },
    user: {
      name: session?.user.name || "Vendedor",
    },
  };

  const preview = resolveTemplateVariables(template, sampleContext);
  const validation = validateTemplate(template);
  const variables = extractVariables(template);

  return NextResponse.json({
    preview,
    original: template,
    variables,
    warnings: validation.warnings,
  });
}, { requiredPermission: "templates:read" });
