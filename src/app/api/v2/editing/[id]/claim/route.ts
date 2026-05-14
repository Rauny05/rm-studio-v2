import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import type { Role } from "@prisma/client";

interface ClaimBody {
  action: "claim" | "unclaim";
}

// POST /api/v2/editing/[id]/claim — claim or unclaim an EditTask
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const userId = session.user.id!;
  const userRole = (session.user as { role: Role }).role;

  let body: ClaimBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { action } = body;
  if (action !== "claim" && action !== "unclaim") {
    return NextResponse.json(
      { error: 'action must be "claim" or "unclaim"' },
      { status: 400 }
    );
  }

  try {
    const task = await db.editTask.findUnique({ where: { id } });
    if (!task) {
      return NextResponse.json({ error: "EditTask not found" }, { status: 404 });
    }

    if (action === "claim") {
      // If already claimed by someone else, reject
      if (task.claimedByUserId !== null && task.claimedByUserId !== userId) {
        return NextResponse.json(
          { error: "Already claimed by another editor" },
          { status: 409 }
        );
      }

      const updated = await db.editTask.update({
        where: { id },
        data: {
          claimedByUserId: userId,
          claimedAt: new Date(),
          status: "CLAIMED",
        },
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
          deliverableId: updated.deliverableId,
          userId,
          action: "edit_claimed",
          meta: { editTaskId: id },
        },
      });

      return NextResponse.json({ task: updated });
    }

    // action === "unclaim"
    // Only allow if claimed by self OR user is ADMIN
    if (task.claimedByUserId !== userId && userRole !== "ADMIN") {
      return NextResponse.json(
        { error: "You can only unclaim tasks you have claimed" },
        { status: 403 }
      );
    }

    const updated = await db.editTask.update({
      where: { id },
      data: {
        claimedByUserId: null,
        claimedAt: null,
        status: "READY_FOR_EDIT",
      },
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
        deliverableId: updated.deliverableId,
        userId,
        action: "edit_unclaimed",
        meta: { editTaskId: id },
      },
    });

    return NextResponse.json({ task: updated });
  } catch (error) {
    console.error("[POST /api/v2/editing/[id]/claim]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
