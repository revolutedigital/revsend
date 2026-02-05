"use client";

import { useState, useEffect, use } from "react";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { RevSendMascotMini } from "@/components/logo/RevSendMascot";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Building2,
  Users,
  Loader2,
  CheckCircle2,
  XCircle,
  LogIn,
  UserPlus,
  Shield,
} from "lucide-react";

interface InviteData {
  email: string | null;
  role: string;
  organization: {
    id: string;
    name: string;
  };
  invitedBy: {
    name: string | null;
    email: string;
  };
  expiresAt: string;
}

export default function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const { data: session, status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [invite, setInvite] = useState<InviteData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Fetch invite details
  useEffect(() => {
    const fetchInvite = async () => {
      try {
        const response = await fetch(`/api/invites/accept?token=${token}`);
        const data = await response.json();

        if (response.ok && data.valid) {
          setInvite(data.invite);
        } else {
          setError(data.error || "Convite invalido");
        }
      } catch (err) {
        setError("Erro ao carregar convite");
      } finally {
        setLoading(false);
      }
    };

    fetchInvite();
  }, [token]);

  // Accept invite
  const handleAccept = async () => {
    if (!session?.user) return;

    setAccepting(true);
    try {
      const response = await fetch("/api/invites/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(true);
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          router.push("/dashboard");
        }, 2000);
      } else {
        setError(data.error || "Erro ao aceitar convite");
      }
    } catch (err) {
      setError("Erro ao aceitar convite");
    } finally {
      setAccepting(false);
    }
  };

  const getRoleBadge = (role: string) => {
    const roles: Record<string, { label: string; color: string }> = {
      gerente: { label: "Gerente", color: "bg-blue-500/10 text-blue-500" },
      vendedor: { label: "Vendedor", color: "bg-green-500/10 text-green-500" },
    };
    return roles[role] || roles.vendedor;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-orange" />
      </div>
    );
  }

  if (error && !invite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center">
              <XCircle className="h-6 w-6 text-red-500" />
            </div>
            <CardTitle>Convite Invalido</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button variant="outline" onClick={() => router.push("/login")}>
              Ir para Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
            </div>
            <CardTitle>Convite Aceito!</CardTitle>
            <CardDescription>
              Voce agora faz parte de {invite?.organization.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Redirecionando para o dashboard...
            </p>
            <Loader2 className="h-5 w-5 animate-spin mx-auto text-orange" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const badge = invite ? getRoleBadge(invite.role) : null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <RevSendMascotMini className="w-12 h-12" />
          </div>
          <CardTitle>Voce foi convidado!</CardTitle>
          <CardDescription>
            {invite?.invitedBy.name || invite?.invitedBy.email} convidou voce para fazer parte de uma organizacao
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Organization Info */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-orange/10 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-orange" />
              </div>
              <div className="flex-1">
                <p className="font-medium">{invite?.organization.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Shield className="h-3 w-3 text-muted-foreground" />
                  <span className={`px-2 py-0.5 text-xs rounded-full ${badge?.color}`}>
                    {badge?.label}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Invite email hint */}
          {invite?.email && (
            <p className="text-xs text-center text-muted-foreground">
              Este convite foi enviado para <strong>{invite.email}</strong>
            </p>
          )}

          {/* Error message */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Actions based on auth status */}
          {status === "loading" ? (
            <div className="flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : session?.user ? (
            // User is logged in
            <div className="space-y-3">
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-sm text-blue-600 dark:text-blue-400">
                Logado como <strong>{session.user.email}</strong>
              </div>
              <Button
                variant="orange"
                className="w-full"
                onClick={handleAccept}
                disabled={accepting}
              >
                {accepting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Aceitando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Aceitar Convite
                  </>
                )}
              </Button>
            </div>
          ) : (
            // User is not logged in
            <div className="space-y-3">
              <p className="text-sm text-center text-muted-foreground">
                Faca login ou crie uma conta para aceitar o convite
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={() => signIn(undefined, { callbackUrl: `/invite/${token}` })}
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  Login
                </Button>
                <Button
                  variant="orange"
                  onClick={() => router.push(`/register?invite=${token}`)}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Criar Conta
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
