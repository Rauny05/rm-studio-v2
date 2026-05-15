import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";
import { authConfig } from "@/lib/auth.config";
import type { Role } from "@prisma/client";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(db),
  callbacks: {
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.role = (user as { role: Role }).role;
      }
      return session;
    },
  },
});

// ── Role-based permission helpers ─────────────────────────────────────────────

export type Permission =
  | "deliverable:create"
  | "deliverable:edit"
  | "deliverable:delete"
  | "deliverable:transition"
  | "production:manage"
  | "edit:claim"
  | "edit:manage"
  | "publish:manage"
  | "team:manage"
  | "finance:view"
  | "analytics:view";

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  ADMIN: [
    "deliverable:create",
    "deliverable:edit",
    "deliverable:delete",
    "deliverable:transition",
    "production:manage",
    "edit:claim",
    "edit:manage",
    "publish:manage",
    "team:manage",
    "finance:view",
    "analytics:view",
  ],
  PRODUCTION_LEAD: [
    "deliverable:create",
    "deliverable:edit",
    "deliverable:transition",
    "production:manage",
    "analytics:view",
  ],
  EDITOR: [
    "edit:claim",
    "edit:manage",
    "deliverable:edit",
  ],
  THUMBNAIL_DESIGNER: [
    "deliverable:edit",
  ],
  PUBLISHER: [
    "publish:manage",
    "deliverable:edit",
    "deliverable:transition",
  ],
  WRITER: [
    "deliverable:create",
    "deliverable:edit",
  ],
  FINANCE: [
    "finance:view",
    "analytics:view",
  ],
  VIEWER: [],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export async function requirePermission(permission: Permission) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("UNAUTHENTICATED");
  }
  const role = (session.user as { role: Role }).role;
  if (!hasPermission(role, permission)) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}
