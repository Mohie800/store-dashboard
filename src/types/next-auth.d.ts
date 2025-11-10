import { DefaultSession, DefaultUser } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";
import { Role } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      permissions: Record<string, boolean>;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role: Role;
    permissions: Record<string, boolean>;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    role: Role;
    permissions: Record<string, boolean>;
  }
}
