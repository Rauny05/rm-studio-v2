import { NextResponse } from "next/server";
import pg from "pg";
import net from "net";

export const runtime = "nodejs";

function tcpReachable(host: string, port: number, timeoutMs = 5000): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(timeoutMs);
    socket.on("connect", () => { socket.destroy(); resolve(true); });
    socket.on("error", () => { socket.destroy(); resolve(false); });
    socket.on("timeout", () => { socket.destroy(); resolve(false); });
    socket.connect(port, host);
  });
}

export async function GET() {
  const results: Record<string, unknown> = {};

  results.envVars = {
    AUTH_SECRET: !!process.env.AUTH_SECRET,
    AUTH_URL: process.env.AUTH_URL,
    AUTH_TRUST_HOST: process.env.AUTH_TRUST_HOST,
    DATABASE_URL_preview: process.env.DATABASE_URL?.slice(0, 60),
    NODE_TLS_REJECT_UNAUTHORIZED: process.env.NODE_TLS_REJECT_UNAUTHORIZED,
    VERCEL_REGION: process.env.VERCEL_REGION,
  };

  // TCP reachability tests
  const dbHost = "db.whbixyrybbhuxezqkzlz.supabase.co";
  const poolerHost = "aws-0-ap-south-1.pooler.supabase.com";

  results.tcp = {
    direct_5432: await tcpReachable(dbHost, 5432),
    pooler_6543: await tcpReachable(poolerHost, 6543),
    pooler_5432: await tcpReachable(poolerHost, 5432),
  };

  // Raw pg connection test (no Prisma)
  const dbUrl = process.env.DATABASE_URL ?? "";
  try {
    const pool = new pg.Pool({
      connectionString: dbUrl,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 8000,
      max: 1,
    });
    const res = await pool.query("SELECT 1 as ok");
    await pool.end();
    results.rawPg = { ok: true, rows: res.rows };
  } catch (e) {
    results.rawPg = { ok: false, error: String(e) };
  }

  // Supabase REST test
  try {
    const resp = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/User?select=count`,
      {
        headers: {
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""}`,
        },
      }
    );
    const data = await resp.json();
    results.supabaseRest = { ok: resp.ok, data };
  } catch (e) {
    results.supabaseRest = { ok: false, error: String(e) };
  }

  return NextResponse.json(results, { status: 200 });
}
