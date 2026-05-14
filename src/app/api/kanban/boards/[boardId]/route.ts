import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

type Params = { params: Promise<{ boardId: string }> };

// PATCH /api/kanban/boards/[boardId]
export async function PATCH(req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { boardId } = await params;
  const body = await req.json();
  const { title, description, color, emoji } = body;

  const board = await db.kanbanBoard.update({
    where: { id: boardId },
    data: {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(color !== undefined && { color }),
      ...(emoji !== undefined && { emoji }),
    },
  });

  return NextResponse.json({ board });
}

// DELETE /api/kanban/boards/[boardId]
export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { boardId } = await params;

  await db.kanbanBoard.delete({ where: { id: boardId } });

  return NextResponse.json({ ok: true });
}
