import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

type Params = { params: Promise<{ cardId: string }> };

// PATCH /api/kanban/cards/[cardId] — update card fields OR move to column
export async function PATCH(req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { cardId } = await params;
  const body = await req.json();

  // Handle column move with reordering
  if (body.columnId !== undefined && body.order !== undefined) {
    const card = await db.kanbanCard.update({
      where: { id: cardId },
      data: {
        columnId: body.columnId,
        order: body.order,
      },
    });
    return NextResponse.json({ card });
  }

  // General field update
  const {
    title,
    description,
    deliverableType,
    thumbnailUrl,
    videoLink,
    tags,
    priority,
    dueDate,
    notes,
    order,
  } = body;

  const card = await db.kanbanCard.update({
    where: { id: cardId },
    data: {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(deliverableType !== undefined && { deliverableType }),
      ...(thumbnailUrl !== undefined && { thumbnailUrl }),
      ...(videoLink !== undefined && { videoLink }),
      ...(tags !== undefined && { tags }),
      ...(priority !== undefined && { priority }),
      ...(dueDate !== undefined && { dueDate }),
      ...(notes !== undefined && { notes }),
      ...(order !== undefined && { order }),
    },
  });

  return NextResponse.json({ card });
}

// DELETE /api/kanban/cards/[cardId]
export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { cardId } = await params;
  await db.kanbanCard.delete({ where: { id: cardId } });

  return NextResponse.json({ ok: true });
}
