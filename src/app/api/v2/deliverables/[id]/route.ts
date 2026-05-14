import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

// GET /api/v2/deliverables/[id] — full detail
export async function GET(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const deliverable = await db.deliverable.findUnique({
    where: { id },
    include: {
      assignedTo: { select: { id: true, name: true, image: true, role: true } },
      production: {
        include: {
          assignedTo: { select: { id: true, name: true, image: true } },
        },
      },
      editTask: {
        include: {
          claimedBy: { select: { id: true, name: true, image: true } },
          versions: { orderBy: { createdAt: "desc" } },
        },
      },
      thumbnailTask: true,
      publishTask: true,
      versions: { orderBy: { createdAt: "desc" } },
      revisions: { orderBy: { createdAt: "desc" } },
      comments: {
        where: { parentId: null },
        orderBy: { createdAt: "asc" },
        include: {
          user: { select: { id: true, name: true, image: true } },
          replies: {
            orderBy: { createdAt: "asc" },
            include: {
              user: { select: { id: true, name: true, image: true } },
            },
          },
        },
      },
      activities: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: {
          user: { select: { id: true, name: true, image: true } },
        },
      },
    },
  });

  if (!deliverable) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ deliverable });
}

// PATCH /api/v2/deliverables/[id] — update fields
export async function PATCH(req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  // Whitelist updatable fields
  const allowed = [
    "title", "brand", "type", "priority", "status",
    "deadline", "publishDate", "platforms",
    "script", "notes", "hook", "description",
    "footageFolder", "thumbnailLink", "exportLink", "publishedUrl",
    "publishTitle", "publishDesc", "publishTags",
    "pocName", "pocEmail", "pocCompany",
    "invoiceNumber", "emailSent", "advance50", "payment100",
    "obsidianPath",
  ] as const;

  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) {
      if (key === "deadline" || key === "publishDate") {
        updates[key] = body[key] ? new Date(body[key]) : null;
      } else {
        updates[key] = body[key];
      }
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const deliverable = await db.deliverable.update({
    where: { id },
    data: updates,
  });

  // Log the update
  await db.activityLog.create({
    data: {
      deliverableId: id,
      userId: session.user.id!,
      action: "deliverable_updated",
      meta: { fields: Object.keys(updates) },
    },
  });

  return NextResponse.json({ deliverable });
}

// DELETE /api/v2/deliverables/[id]
export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await db.deliverable.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
