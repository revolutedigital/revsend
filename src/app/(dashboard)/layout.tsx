import { redirect } from "next/navigation";
import dynamic from "next/dynamic";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { Announcer } from "@/components/ui/announcer";
import { OnboardingProvider } from "@/components/onboarding/OnboardingProvider";
import { DynamicBreadcrumb } from "@/components/dashboard/DynamicBreadcrumb";

const CommandPalette = dynamic(
  () => import("@/components/command-palette").then((mod) => mod.CommandPalette),
  { ssr: false }
);

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
            <div className="px-6 pt-4">
              <DynamicBreadcrumb />
            </div>
            <OnboardingProvider>
              {children}
            </OnboardingProvider>
          </div>
        </main>
        <CommandPalette />
        <Announcer />
      </div>
    </SessionProvider>
  );
}
