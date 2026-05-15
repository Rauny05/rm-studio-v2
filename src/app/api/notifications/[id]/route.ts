import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { auth } from "@/lib/auth";

export async function PATCH(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const supabase = getSupabaseAdmin();

  const { data: notification, error } = await supabase
    .from("Notification")
    .update({ read: true })
    .eq("id", id)
    .eq("userId", session.user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ notification });
}
