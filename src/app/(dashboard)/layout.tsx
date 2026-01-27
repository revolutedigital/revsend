import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { CommandPalette } from "@/components/command-palette";
import { Announcer } from "@/components/ui/announcer";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <SessionProvider session={session}>
      {/* Skip Link for Accessibility */}
      <a
        href="#main-content"
        className="skip-link"
      >
        Pular para o conteúdo principal
      </a>

      <div className="min-h-screen bg-background">
        <Sidebar />
        {/* ml-0 no mobile, ml-64 no desktop */}
        <main
          id="main-content"
          className="lg:ml-64 pt-16 lg:pt-0 animate-fade-in transition-all duration-300"
          role="main"
          aria-label="Conteúdo principal"
        >
          <div className="min-h-screen">
            {children}
          </div>
        </main>
        <CommandPalette />
        <Announcer />
      </div>
    </SessionProvider>
  );
}
