import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateMessageVariations } from "@/lib/ai/variations";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { message, count = 5 } = await request.json();

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { error: "Mensagem é obrigatória" },
        { status: 400 }
      );
    }

    if (count < 1 || count > 10) {
      return NextResponse.json(
        { error: "Quantidade deve ser entre 1 e 10" },
        { status: 400 }
      );
    }

    const variations = await generateMessageVariations(message, count, session.user.id);

    return NextResponse.json({ variations });
  } catch (error) {
    console.error("Erro ao gerar variações:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro ao gerar variações. Verifique sua API key.";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
