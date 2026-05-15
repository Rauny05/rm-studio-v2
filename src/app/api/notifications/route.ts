import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const { data: notifications, error } = await supabase
    .from("Notification")
    .select("*")
    .eq("userId", session.user.id)
    .order("createdAt", { ascending: false })
    .limit(20);

  if (error) return NextResponse.json({ notifications: [] });
  return NextResponse.json({ notifications: notifications ?? [] });
}
