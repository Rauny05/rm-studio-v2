import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

type ShootAction = "start" | "pause" | "resume" | "wrap";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await db.productionCard.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const action: ShootAction = body.action;

  if (!["start", "pause", "resume", "wrap"].includes(action)) {
    return NextResponse.json(
      { error: "Invalid action. Must be one of: start, pause, resume, wrap" },
      { status: 400 }
    );
  }

  const now = new Date();
  let updateData: Record<string, unknown> = {};

  switch (action) {
    case "start":
      updateData = {
        shootStartAt: now,
        status: "SHOOTING",
      };
      break;

    case "pause":
      updateData = {
        pausedAt: now,
        status: "SHOOTING",
      };
      break;

    case "resume":
      updateData = {
        pausedAt: null,
      };
      break;

    case "wrap": {
      const shootStartAt = existing.shootStartAt ?? now;
      const totalDuration = Math.floor(
        (now.getTime() - shootStartAt.getTime()) / 1000
      );
      updateData = {
        shootEndAt: now,
        totalDuration,
        status: "BACKUP_PENDING",
      };
      break;
    }
  }

  const card = await db.productionCard.update({
    where: { id },
    data: updateData,
    include: {
      deliverable: true,
      assignedTo: {
        select: { id: true, name: true, email: true, image: true },
      },
    },
  });

  await db.activityLog.create({
    data: {
      deliverableId: card.deliverableId,
      userId: session.user.id,
      action: `shoot_${action}`,
      meta: { cardId: id, timestamp: now.toISOString() },
    },
  });

  return NextResponse.json({ card });
}
