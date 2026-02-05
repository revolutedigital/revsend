import { DefaultSession, DefaultUser } from "next-auth";
import { JWT, DefaultJWT } from "next-auth/jwt";
import { Role } from "@/lib/permissions";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      isMaster: boolean;
      currentOrgId: string | null;
      currentOrgRole: string | null; // "gerente" | "vendedor"
      role: Role; // Effective role (computed from isMaster + orgRole)
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    isMaster: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    isMaster: boolean;
    currentOrgId: string | null;
    currentOrgRole: string | null;
  }
}
