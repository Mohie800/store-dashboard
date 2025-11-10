export type AppRole = "ADMIN" | "MANAGER" | "USER";

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: AppRole;
  permissions: Record<string, boolean>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
