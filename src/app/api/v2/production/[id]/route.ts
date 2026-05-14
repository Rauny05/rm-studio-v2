import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const ALLOWED_FIELDS = new Set([
  "status",
  "location",
  "equipment",
  "footageLink",
  "footageUploaded",
  "backupConfirmed",
  "folderName",
  "isDelayed",
  "delayReason",
  "assignedUserId",
  "notes",
]);

export async function PATCH(
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

  // Whitelist fields
  const data: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body)) {
    if (ALLOWED_FIELDS.has(key)) {
      data[key] = value;
    }
  }

  const card = await db.productionCard.update({
    where: { id },
    data,
    include: {
      deliverable: true,
      assignedTo: {
        select: { id: true, name: true, email: true, image: true },
      },
    },
  });

  // Build a readable summary of what changed
  const changedFields = Object.keys(data);
  await db.activityLog.create({
    data: {
      deliverableId: card.deliverableId,
      userId: session.user.id,
      action: "production_updated",
      meta: { updatedFields: changedFields, cardId: id },
    },
  });

  return NextResponse.json({ card });
}
