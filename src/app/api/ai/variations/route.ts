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

    if (count < 1 || count > 9) {
      return NextResponse.json(
        { error: "Quantidade deve ser entre 1 e 9" },
        { status: 400 }
      );
    }

    const variations = await generateMessageVariations(message, count);

    return NextResponse.json({ variations });
  } catch (error) {
    console.error("Erro ao gerar variações:", error);
    return NextResponse.json(
      { error: "Erro ao gerar variações. Verifique sua API key." },
      { status: 500 }
    );
  }
}
