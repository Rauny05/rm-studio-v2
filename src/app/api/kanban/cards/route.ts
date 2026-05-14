import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

// POST /api/kanban/cards — create card
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    columnId,
    boardId,
    title,
    description = "",
    deliverableType = null,
    thumbnailUrl = null,
    videoLink = null,
    tags = [],
    priority = "medium",
    dueDate = null,
    notes = "",
  } = body;

  if (!columnId || !boardId || !title?.trim()) {
    return NextResponse.json({ error: "columnId, boardId, and title are required" }, { status: 400 });
  }

  // Get next order in column
  const lastCard = await db.kanbanCard.findFirst({
    where: { columnId },
    orderBy: { order: "desc" },
    select: { order: true },
  });
  const order = (lastCard?.order ?? -1) + 1;

  const card = await db.kanbanCard.create({
    data: {
      columnId,
      boardId,
      title: title.trim(),
      description,
      deliverableType,
      thumbnailUrl,
      videoLink,
      tags,
      priority,
      dueDate,
      notes,
      order,
    },
  });

  return NextResponse.json({ card }, { status: 201 });
}
