import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { db } from "@/lib/db";
import { validatePasswordStrength } from "@/lib/auth/password-reset";
import { rateLimit, RATE_LIMITS, getRateLimitIdentifier } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    // Rate limiting
    const identifier = getRateLimitIdentifier(request);
    const rl = await rateLimit(`register:${identifier}`, RATE_LIMITS.REGISTER);
    if (!rl.success) {
      return NextResponse.json(
        { error: "Muitas tentativas. Tente novamente mais tarde." },
        { status: 429 }
      );
    }

    const { name, email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email e senha são obrigatórios" },
        { status: 400 }
      );
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: "Senha não atende os requisitos", errors: passwordValidation.errors },
        { status: 400 }
      );
    }

    // Verificar se o usuário já existe
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Este email já está em uso" },
        { status: 400 }
      );
    }

    // Hash da senha
    const passwordHash = await hash(password, 12);

    // Criar usuário
    const user = await db.user.create({
      data: {
        name,
        email,
        passwordHash,
      },
    });

    return NextResponse.json(
      {
        message: "Usuário criado com sucesso",
        user: { id: user.id, email: user.email, name: user.name },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro ao criar usuário:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
