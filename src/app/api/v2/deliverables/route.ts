import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import type { DeliverableStatus, DeliverableType, Priority } from "@prisma/client";

// GET /api/v2/deliverables — list with filters
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") as DeliverableStatus | null;
  const brand = searchParams.get("brand");
  const type = searchParams.get("type") as DeliverableType | null;
  const priority = searchParams.get("priority") as Priority | null;
  const search = searchParams.get("q");

  const deliverables = await db.deliverable.findMany({
    where: {
      ...(status && { status }),
      ...(brand && { brand: { contains: brand, mode: "insensitive" } }),
      ...(type && { type }),
      ...(priority && { priority }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { brand: { contains: search, mode: "insensitive" } },
          { pnNo: { contains: search, mode: "insensitive" } },
        ],
      }),
    },
    include: {
      assignedTo: { select: { id: true, name: true, image: true, role: true } },
      production: {
        select: {
          id: true,
          status: true,
          shootStartAt: true,
          totalDuration: true,
          isDelayed: true,
          assignedTo: { select: { id: true, name: true, image: true } },
        },
      },
      editTask: {
        select: {
          id: true,
          status: true,
          revisionCount: true,
          claimedAt: true,
          claimedBy: { select: { id: true, name: true, image: true } },
        },
      },
      thumbnailTask: { select: { id: true, status: true, thumbnailUrl: true } },
      publishTask: { select: { id: true, status: true, scheduledFor: true, publishedAt: true } },
      _count: { select: { comments: true, revisions: true } },
    },
    orderBy: [{ priority: "desc" }, { deadline: "asc" }, { updatedAt: "desc" }],
  });

  return NextResponse.json({ deliverables });
}

// POST /api/v2/deliverables — create deliverable + auto-generate workflow tasks
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    title,
    brand,
    type = "YOUTUBE_VIDEO",
    priority = "MEDIUM",
    deadline,
    publishDate,
    platforms = [],
    pocName,
    pocEmail,
    pocCompany,
    notes,
    script,
    invoiceNumber,
  } = body;

  if (!title?.trim() || !brand?.trim()) {
    return NextResponse.json({ error: "title and brand are required" }, { status: 400 });
  }

  // Generate pnNo: e.g. "my26-001" (month + year + sequence)
  const pnNo = await generatePnNo();

  const deliverable = await db.deliverable.create({
    data: {
      pnNo,
      title: title.trim(),
      brand: brand.trim(),
      type,
      priority,
      status: "DRAFT",
      platforms,
      deadline: deadline ? new Date(deadline) : undefined,
      publishDate: publishDate ? new Date(publishDate) : undefined,
      pocName,
      pocEmail,
      pocCompany,
      notes,
      script,
      invoiceNumber,
    },
    include: {
      assignedTo: { select: { id: true, name: true, image: true } },
      production: true,
      editTask: true,
      thumbnailTask: true,
      publishTask: true,
    },
  });

  // Log creation activity
  await db.activityLog.create({
    data: {
      deliverableId: deliverable.id,
      userId: session.user.id!,
      action: "deliverable_created",
      meta: { pnNo, title, brand, type },
    },
  });

  return NextResponse.json({ deliverable }, { status: 201 });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function generatePnNo(): Promise<string> {
  const now = new Date();
  const monthMap = [
    "ja", "fe", "ma", "ap", "my", "ju",
    "jl", "au", "se", "oc", "no", "de",
  ];
  const prefix = monthMap[now.getMonth()] + String(now.getFullYear()).slice(2);

  // Count existing deliverables this month
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const count = await db.deliverable.count({
    where: { createdAt: { gte: startOfMonth } },
  });

  const seq = String(count + 1).padStart(3, "0");
  return `${prefix}-${seq}`;
}
