import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

// GET /api/kanban/boards — fetch all boards with columns and cards
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const boards = await db.kanbanBoard.findMany({
    orderBy: { order: "asc" },
    include: {
      columns: {
        orderBy: { order: "asc" },
        include: {
          cards: {
            orderBy: { order: "asc" },
          },
        },
      },
    },
  });

  return NextResponse.json({ boards });
}

// POST /api/kanban/boards — create a new board
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { title, description = "", color = "#7c3aed", emoji = "🎬" } = body;

  if (!title?.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  // Get highest order value
  const lastBoard = await db.kanbanBoard.findFirst({
    orderBy: { order: "desc" },
    select: { order: true },
  });
  const order = (lastBoard?.order ?? -1) + 1;

  // Create board with default columns
  const board = await db.kanbanBoard.create({
    data: {
      title: title.trim(),
      description,
      color,
      emoji,
      order,
      columns: {
        create: [
          { title: "Ideas", order: 0 },
          { title: "Writing", order: 1 },
          { title: "Production", order: 2 },
          { title: "Editing", order: 3 },
          { title: "Published", order: 4 },
        ],
      },
    },
    include: {
      columns: {
        orderBy: { order: "asc" },
        include: { cards: true },
      },
    },
  });

  return NextResponse.json({ board }, { status: 201 });
}
