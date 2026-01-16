"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { RevSendLogo } from "@/components/logo/RevSendLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Erro ao criar conta");
      } else {
        router.push("/login?registered=true");
      }
    } catch {
      setError("Ocorreu um erro. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full border-navy-400/30 bg-navy-600/50 backdrop-blur-sm shadow-2xl">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <RevSendLogo className="w-20 h-20 hover-lift" />
        </div>
        <CardTitle className="text-2xl font-display text-white">
          Criar conta no <span className="text-coral">RevSend</span>
        </CardTitle>
        <CardDescription className="text-navy-200">
          Preencha os dados abaixo para criar sua conta
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg border border-destructive/20">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name" className="text-navy-100">Nome</Label>
            <Input
              id="name"
              type="text"
              placeholder="Seu nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="bg-navy-500/50 border-navy-400/50 focus:border-coral focus:ring-coral/30 placeholder:text-navy-300 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-navy-100">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-navy-500/50 border-navy-400/50 focus:border-coral focus:ring-coral/30 placeholder:text-navy-300 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-navy-100">Senha</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-navy-500/50 border-navy-400/50 focus:border-coral focus:ring-coral/30 placeholder:text-navy-300 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-navy-100">Confirmar Senha</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="bg-navy-500/50 border-navy-400/50 focus:border-coral focus:ring-coral/30 placeholder:text-navy-300 text-white"
            />
          </div>

          <Button
            type="submit"
            variant="coral"
            size="lg"
            className="w-full"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Criando conta...
              </>
            ) : (
              "Criar Conta"
            )}
          </Button>

          <p className="text-center text-sm text-navy-200">
            Já tem uma conta?{" "}
            <Link href="/login" className="text-coral hover:text-coral-400 transition-colors font-medium">
              Entrar
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
