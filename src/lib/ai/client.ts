import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/lib/db";
import { decrypt, isEncrypted } from "@/lib/encryption";

// Criar cliente Anthropic com API key do usuario
export async function getAnthropicClient(userId: string): Promise<Anthropic> {
  // Primeiro tenta buscar a key do usuario no banco
  const settings = await db.userSettings.findUnique({
    where: { userId },
    select: { anthropicApiKey: true },
  });

  let apiKey = settings?.anthropicApiKey || process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error("API key da Anthropic nao configurada. Configure em Configuracoes.");
  }

  // Decriptar a key se estiver encriptada
  if (settings?.anthropicApiKey && isEncrypted(settings.anthropicApiKey)) {
    try {
      apiKey = decrypt(settings.anthropicApiKey);
    } catch (error) {
      console.error("Erro ao decriptar API key:", error);
      throw new Error("Erro ao decriptar API key. Por favor, reconfigure suas credenciais.");
    }
  }

  return new Anthropic({ apiKey });
}

// Cliente padrao (para uso sem contexto de usuario)
const globalForAnthropic = globalThis as unknown as {
  anthropic: Anthropic | undefined;
};

export const anthropic =
  globalForAnthropic.anthropic ??
  new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY || "dummy-key",
  });

if (process.env.NODE_ENV !== "production") {
  globalForAnthropic.anthropic = anthropic;
}
