import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { auth } from "@/lib/auth";

export async function PATCH() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getSupabaseAdmin();
  await supabase.from("Notification").update({ read: true }).eq("userId", session.user.id).eq("read", false);

  return NextResponse.json({ success: true });
}
