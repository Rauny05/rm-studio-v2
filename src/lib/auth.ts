import NextAuth from "next-auth";
import { createClient } from "@supabase/supabase-js";
import { authConfig } from "@/lib/auth.config";
import type { Role } from "@prisma/client";

// ── Supabase admin client (uses REST API — works from Vercel) ─────────────────
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// ── NextAuth — JWT sessions (no DB connection required for auth) ───────────────
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  session: { strategy: "jwt" },
  callbacks: {
    // Spread the authorized callback from authConfig, plus our custom ones
    ...authConfig.callbacks,

    async jwt({ token, user, account }) {
      // Only runs on sign-in (user is populated)
      if (user?.email) {
        const supabase = getSupabaseAdmin();

        // Upsert user in DB via Supabase REST API
        const { data: existing } = await supabase
          .from("User")
          .select("id, role")
          .eq("email", user.email)
          .maybeSingle();

        if (existing) {
          // Update name/image on each sign-in
          await supabase
            .from("User")
            .update({ name: user.name, image: user.image, updatedAt: new Date().toISOString() })
            .eq("id", existing.id);

          token.uid = existing.id;
          token.role = existing.role;
        } else {
          // Create new user with VIEWER role by default
          const { data: created } = await supabase
            .from("User")
            .insert({
              email: user.email,
              name: user.name,
              image: user.image,
              role: "VIEWER",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            })
            .select("id, role")
            .single();

          token.uid = created?.id;
          token.role = created?.role ?? "VIEWER";
        }
      }
      return token;
    },

    session({ session, token }) {
      if (session.user) {
        session.user.id = token.uid as string;
        session.user.role = token.role as Role;
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
  EDITOR: ["edit:claim", "edit:manage", "deliverable:edit"],
  THUMBNAIL_DESIGNER: ["deliverable:edit"],
  PUBLISHER: ["publish:manage", "deliverable:edit", "deliverable:transition"],
  WRITER: ["deliverable:create", "deliverable:edit"],
  FINANCE: ["finance:view", "analytics:view"],
  VIEWER: [],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export async function requirePermission(permission: Permission) {
  const session = await auth();
  if (!session?.user) throw new Error("UNAUTHENTICATED");
  const role = (session.user as { role: Role }).role;
  if (!hasPermission(role, permission)) throw new Error("UNAUTHORIZED");
  return session;
}
