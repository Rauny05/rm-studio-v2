import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const results: Record<string, unknown> = {};

  // 1. Check env vars are present (not values)
  results.envVars = {
    AUTH_SECRET: !!process.env.AUTH_SECRET,
    AUTH_URL: process.env.AUTH_URL,
    AUTH_TRUST_HOST: process.env.AUTH_TRUST_HOST,
    DATABASE_URL_set: !!process.env.DATABASE_URL,
    GOOGLE_CLIENT_ID_prefix: process.env.GOOGLE_CLIENT_ID?.slice(0, 20),
    GOOGLE_CLIENT_SECRET_set: !!process.env.GOOGLE_CLIENT_SECRET,
    NODE_TLS_REJECT_UNAUTHORIZED: process.env.NODE_TLS_REJECT_UNAUTHORIZED,
  };

  // 2. Try DB connection
  try {
    const { db } = await import("@/lib/db");
    const count = await db.user.count();
    results.db = { ok: true, userCount: count };
  } catch (e) {
    results.db = { ok: false, error: String(e) };
  }

  // 3. Try auth initialization
  try {
    const { auth } = await import("@/lib/auth");
    results.auth = { ok: !!auth };
  } catch (e) {
    results.auth = { ok: false, error: String(e) };
  }

  return NextResponse.json(results, { status: 200 });
}
