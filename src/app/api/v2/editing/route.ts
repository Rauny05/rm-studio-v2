import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import type { EditStatus } from "@prisma/client";

// GET /api/v2/editing — list all EditTasks with relations, optional ?status= filter
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") as EditStatus | null;

  try {
    const tasks = await db.editTask.findMany({
      where: {
        ...(status && { status }),
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
          select: {
            id: true,
            name: true,
            image: true,
            role: true,
          },
        },
        versions: {
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error("[GET /api/v2/editing]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
