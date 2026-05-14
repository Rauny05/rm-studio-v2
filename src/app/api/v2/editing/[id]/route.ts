import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import type { EditStatus } from "@prisma/client";

interface EditTaskPatchBody {
  status?: EditStatus;
  footageFolder?: string;
  footageNotes?: string;
  notes?: string;
}

// PATCH /api/v2/editing/[id] — update an EditTask (whitelisted fields only)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  let body: EditTaskPatchBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Whitelist allowed fields
  const { status, footageFolder, footageNotes, notes } = body;
  const updateData: EditTaskPatchBody = {};
  if (status !== undefined) updateData.status = status;
  if (footageFolder !== undefined) updateData.footageFolder = footageFolder;
  if (footageNotes !== undefined) updateData.footageNotes = footageNotes;
  if (notes !== undefined) updateData.notes = notes;

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  try {
    const existing = await db.editTask.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "EditTask not found" }, { status: 404 });
    }

    const task = await db.editTask.update({
      where: { id },
      data: updateData,
      include: {
        deliverable: {
          select: {
            id: true,
            title: true,
            brand: true,
            type: true,
            status: true,
            priority: true,
            pnNo: true,
            deadline: true,
          },
        },
        claimedBy: {
          select: { id: true, name: true, image: true, role: true },
        },
        versions: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    await db.activityLog.create({
      data: {
        deliverableId: task.deliverableId,
        userId: session.user.id!,
        action: "edit_task_updated",
        meta: JSON.parse(JSON.stringify({ editTaskId: id, changes: updateData })),
      },
    });

    return NextResponse.json({ task });
  } catch (error) {
    console.error("[PATCH /api/v2/editing/[id]]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
