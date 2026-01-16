import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { SessionProvider } from "@/components/providers/SessionProvider";

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
      <div className="min-h-screen bg-background">
        <Sidebar />
        <main className="ml-64 animate-fade-in">
          <div className="min-h-screen">
            {children}
          </div>
        </main>
      </div>
    </SessionProvider>
  );
}
