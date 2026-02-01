import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { db } from "@/lib/db";
import * as XLSX from "xlsx";
import { normalizeFields, normalizePhoneNumber } from "@/lib/ai/normalize";

export const POST = apiHandler(async (req: NextRequest, { session }) => {
  const formData = await req.formData();
  const file = formData.get("file") as File;
  const listName = formData.get("name") as string;

  if (!file) {
    return NextResponse.json(
      { error: "Nenhum arquivo enviado" },
      { status: 400 }
    );
  }

  // Ler o arquivo
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json<Record<string, string>>(worksheet, {
    raw: false,
  });

  if (jsonData.length === 0) {
    return NextResponse.json(
      { error: "Planilha vazia ou formato inválido" },
      { status: 400 }
    );
  }

  // Obter cabeçalhos
  const headers = Object.keys(jsonData[0]);

  // Normalizar campos com IA
  const normalization = await normalizeFields(headers, jsonData.slice(0, 10));

  if (!normalization.phoneField) {
    return NextResponse.json(
      { error: "Não foi possível identificar o campo de telefone" },
      { status: 400 }
    );
  }

  // Criar a lista
  const list = await db.contactList.create({
    data: {
      userId: session!.user.id,
      name: listName || file.name.replace(/\.[^/.]+$/, ""),
      originalFilename: file.name,
      totalContacts: jsonData.length,
    },
  });

  // Processar e inserir contatos
  const contacts = jsonData.map((row) => {
    const phoneRaw = row[normalization.phoneField!] || "";
    const phoneNumber = normalizePhoneNumber(phoneRaw);
    const name = normalization.nameField ? row[normalization.nameField] : null;

    // Campos extras (todos menos telefone e nome)
    const extraFields: Record<string, string> = {};
    for (const field of normalization.fields) {
      if (
        field.originalName !== normalization.phoneField &&
        field.originalName !== normalization.nameField
      ) {
        extraFields[field.normalizedName] = row[field.originalName] || "";
      }
    }

    return {
      listId: list.id,
      phoneNumber,
      name,
      extraFields,
    };
  });

  // Filtrar contatos com telefone válido
  const validContacts = contacts.filter(
    (c) => c.phoneNumber && c.phoneNumber.length >= 10
  );

  // Inserir em batch
  await db.contact.createMany({
    data: validContacts,
  });

  // Atualizar contagem real
  await db.contactList.update({
    where: { id: list.id },
    data: { totalContacts: validContacts.length },
  });

  return NextResponse.json({
    success: true,
    list: {
      id: list.id,
      name: list.name,
      totalContacts: validContacts.length,
      skippedContacts: contacts.length - validContacts.length,
    },
    normalization: {
      phoneField: normalization.phoneField,
      nameField: normalization.nameField,
      fields: normalization.fields,
    },
  });
});
