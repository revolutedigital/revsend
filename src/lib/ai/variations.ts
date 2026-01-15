import { anthropic } from "./client";

export async function generateMessageVariations(
  originalMessage: string,
  count: number = 5
): Promise<string[]> {
  const prompt = `Você é um especialista em copywriting para WhatsApp. Sua tarefa é criar ${count} variações da mensagem abaixo, mantendo o mesmo significado e objetivo, mas variando a forma de expressão.

Mensagem original:
"${originalMessage}"

Regras importantes:
1. Mantenha o tom e a intenção da mensagem original
2. Varie o início das frases (não comece todas da mesma forma)
3. Use sinônimos e reformulações naturais
4. Mantenha a mensagem curta e direta (ideal para WhatsApp)
5. Preserve variáveis como {nome}, {empresa}, etc.
6. Não use emojis a menos que a mensagem original tenha
7. Evite frases muito formais ou robóticas

Responda APENAS com um JSON válido no seguinte formato, sem nenhum texto adicional:
{
  "variations": [
    "variação 1",
    "variação 2",
    "variação 3"
  ]
}`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 2048,
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
    return result.variations;
  } catch (error) {
    console.error("Erro ao gerar variações:", error);
    throw new Error("Não foi possível gerar variações. Verifique sua API key.");
  }
}
