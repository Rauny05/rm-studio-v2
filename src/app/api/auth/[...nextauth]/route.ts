import { handlers } from "@/lib/auth";
import type { NextRequest } from "next/server";

// Explicit wrapper satisfies Next.js 16's Promise<params> route handler signature
export const GET = (req: NextRequest) => handlers.GET(req);
export const POST = (req: NextRequest) => handlers.POST(req);
