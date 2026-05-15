import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { auth } from "@/lib/auth";

// GET /api/v2/deliverables — list with filters
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const brand = searchParams.get("brand");
  const type = searchParams.get("type");
  const priority = searchParams.get("priority");
  const search = searchParams.get("q");

  const supabase = getSupabaseAdmin();

  let query = supabase
    .from("Deliverable")
    .select(`
      id, pnNo, title, brand, type, status, priority, deadline, publishDate,
      invoiceNumber, emailSent, advance50, payment100, pocName, pocEmail, pocCompany,
      platforms, hook, notes, footageFolder, thumbnailLink, exportLink, publishedUrl,
      createdAt, updatedAt,
      ProductionCard(id, status, shootStartAt, totalDuration, isDelayed),
      EditTask(id, status, revisionCount, claimedAt),
      ThumbnailTask(id, status, thumbnailUrl),
      PublishTask(id, status, scheduledFor, publishedAt)
    `)
    .order("createdAt", { ascending: false });

  if (status) query = query.eq("status", status);
  if (brand) query = query.ilike("brand", `%${brand}%`);
  if (type) query = query.eq("type", type);
  if (priority) query = query.eq("priority", priority);
  if (search) {
    query = query.or(
      `title.ilike.%${search}%,brand.ilike.%${search}%,pnNo.ilike.%${search}%,pocName.ilike.%${search}%`
    );
  }

  const { data: deliverables, error } = await query;

  if (error) {
    console.error("Deliverables fetch error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ deliverables: deliverables ?? [] });
}

// POST /api/v2/deliverables — create
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    title, brand,
    type = "YOUTUBE_VIDEO",
    priority = "MEDIUM",
    deadline, publishDate, platforms = [],
    pocName, pocEmail, pocCompany,
    notes, script, invoiceNumber,
  } = body;

  if (!title?.trim() || !brand?.trim()) {
    return NextResponse.json({ error: "title and brand are required" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  // Generate pnNo
  const pnNo = await generatePnNo(supabase);

  const { data: deliverable, error } = await supabase
    .from("Deliverable")
    .insert({
      pnNo,
      title: title.trim(),
      brand: brand.trim(),
      type, priority,
      status: "DRAFT",
      platforms,
      deadline: deadline ?? null,
      publishDate: publishDate ?? null,
      pocName: pocName ?? null,
      pocEmail: pocEmail ?? null,
      pocCompany: pocCompany ?? null,
      notes: notes ?? null,
      script: script ?? null,
      invoiceNumber: invoiceNumber ?? null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("Deliverable create error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Log activity
  await supabase.from("ActivityLog").insert({
    deliverableId: deliverable.id,
    userId: session.user.id,
    action: "deliverable_created",
    meta: { pnNo, title, brand, type },
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({ deliverable }, { status: 201 });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function generatePnNo(supabase: ReturnType<typeof getSupabaseAdmin>): Promise<string> {
  const now = new Date();
  const monthMap = ["ja","fe","ma","ap","my","ju","jl","au","se","oc","no","de"];
  const prefix = monthMap[now.getMonth()] + String(now.getFullYear()).slice(2);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const { count } = await supabase
    .from("Deliverable")
    .select("*", { count: "exact", head: true })
    .gte("createdAt", startOfMonth);

  const seq = String((count ?? 0) + 1).padStart(3, "0");
  return `${prefix}-${seq}`;
}
