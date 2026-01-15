import { anthropic } from "./client";

interface NormalizedField {
  originalName: string;
  normalizedName: string;
  type: "phone" | "name" | "email" | "company" | "other";
  sampleValues: string[];
}

interface NormalizationResult {
  fields: NormalizedField[];
  phoneField: string | null;
  nameField: string | null;
}

export async function normalizeFields(
  headers: string[],
  sampleRows: Record<string, string>[]
): Promise<NormalizationResult> {
  const sampleData = headers.map((header) => ({
    header,
    samples: sampleRows.slice(0, 5).map((row) => row[header] || ""),
  }));

  const prompt = `Analise os seguintes cabeçalhos e amostras de dados de uma planilha de contatos e identifique o tipo de cada campo.

Dados:
${JSON.stringify(sampleData, null, 2)}

Para cada campo, identifique:
1. Se é um campo de telefone (phone)
2. Se é um campo de nome (name)
3. Se é um campo de email (email)
4. Se é um campo de empresa (company)
5. Ou outro tipo (other)

Responda APENAS com um JSON válido no seguinte formato, sem nenhum texto adicional:
{
  "fields": [
    {
      "originalName": "nome do cabeçalho original",
      "normalizedName": "nome_normalizado_snake_case",
      "type": "phone|name|email|company|other"
    }
  ],
  "phoneField": "nome do campo de telefone principal ou null",
  "nameField": "nome do campo de nome principal ou null"
}`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== "text") {
      throw new Error("Resposta inesperada da IA");
    }

    const result = JSON.parse(content.text);

    return {
      fields: result.fields.map((field: NormalizedField) => ({
        ...field,
        sampleValues: sampleData.find((s) => s.header === field.originalName)?.samples || [],
      })),
      phoneField: result.phoneField,
      nameField: result.nameField,
    };
  } catch (error) {
    console.error("Erro ao normalizar campos:", error);

    // Fallback: tenta identificar campos básicos manualmente
    const phonePatterns = /telefone|phone|celular|whatsapp|contato|fone|tel/i;
    const namePatterns = /nome|name|cliente|contato/i;

    const fields: NormalizedField[] = headers.map((header) => {
      let type: NormalizedField["type"] = "other";

      if (phonePatterns.test(header)) {
        type = "phone";
      } else if (namePatterns.test(header)) {
        type = "name";
      } else if (/email|e-mail/i.test(header)) {
        type = "email";
      } else if (/empresa|company|organiza/i.test(header)) {
        type = "company";
      }

      return {
        originalName: header,
        normalizedName: header
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "_")
          .replace(/_+/g, "_"),
        type,
        sampleValues: sampleRows.slice(0, 5).map((row) => row[header] || ""),
      };
    });

    return {
      fields,
      phoneField: fields.find((f) => f.type === "phone")?.originalName || null,
      nameField: fields.find((f) => f.type === "name")?.originalName || null,
    };
  }
}

export function normalizePhoneNumber(phone: string): string {
  // Remove todos os caracteres não numéricos
  let cleaned = phone.replace(/\D/g, "");

  // Se começar com 0, remove
  if (cleaned.startsWith("0")) {
    cleaned = cleaned.substring(1);
  }

  // Se não tiver código do país, adiciona 55 (Brasil)
  if (cleaned.length === 10 || cleaned.length === 11) {
    cleaned = "55" + cleaned;
  }

  // Se tiver 12 dígitos (55 + DDD + 8 dígitos), adiciona o 9
  if (cleaned.length === 12 && cleaned.startsWith("55")) {
    const ddd = cleaned.substring(2, 4);
    const number = cleaned.substring(4);
    cleaned = "55" + ddd + "9" + number;
  }

  return cleaned;
}
