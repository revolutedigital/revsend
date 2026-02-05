"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { RevSendMascotAnimated } from "@/components/logo/RevSendMascot";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Email ou senha inválidos");
      } else {
        router.push("/dashboard");
        router.refresh();
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
          <RevSendMascotAnimated className="w-24 h-28" />
        </div>
        <CardTitle className="text-2xl font-display text-white">
          Entrar no <span className="text-coral">RevSend</span>
        </CardTitle>
        <CardDescription className="text-navy-200">
          Entre com suas credenciais para acessar sua conta
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
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-navy-100">Senha</Label>
              <Link
                href="/forgot-password"
                className="text-xs text-coral hover:text-coral-400 transition-colors"
              >
                Esqueceu a senha?
              </Link>
            </div>
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
                Entrando...
              </>
            ) : (
              "Entrar"
            )}
          </Button>

          <p className="text-center text-sm text-navy-200">
            Não tem uma conta?{" "}
            <Link href="/register" className="text-coral hover:text-coral-400 transition-colors font-medium">
              Criar conta
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
