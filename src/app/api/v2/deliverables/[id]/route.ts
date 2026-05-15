import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { auth } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

// GET /api/v2/deliverables/[id]
export async function GET(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const supabase = getSupabaseAdmin();

  const { data: deliverable, error } = await supabase
    .from("Deliverable")
    .select(`*, ProductionCard(*), EditTask(*), ThumbnailTask(*), PublishTask(*), Comment(*), Revision(*), ActivityLog(*)`)
    .eq("id", id)
    .single();

  if (error || !deliverable) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ deliverable });
}

// PATCH /api/v2/deliverables/[id]
export async function PATCH(req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const supabase = getSupabaseAdmin();

  const allowed = [
    "title","brand","type","priority","status",
    "deadline","publishDate","platforms",
    "script","notes","hook","description",
    "footageFolder","thumbnailLink","exportLink","publishedUrl",
    "publishTitle","publishDesc","publishTags",
    "pocName","pocEmail","pocCompany",
    "invoiceNumber","emailSent","advance50","payment100",
    "obsidianPath",
  ];

  const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };
  for (const key of allowed) {
    if (key in body) updates[key] = body[key] ?? null;
  }

  const { data: deliverable, error } = await supabase
    .from("Deliverable")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from("ActivityLog").insert({
    deliverableId: id,
    userId: session.user.id,
    action: "deliverable_updated",
    meta: { fields: Object.keys(updates).filter(k => k !== "updatedAt") },
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({ deliverable });
}

// DELETE /api/v2/deliverables/[id]
export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const supabase = getSupabaseAdmin();

  const { error } = await supabase.from("Deliverable").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
