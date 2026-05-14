import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import type { VersionLabel } from "@prisma/client";

interface CreateVersionBody {
  label: VersionLabel;
  url: string;
  notes?: string;
}

// POST /api/v2/editing/[id]/versions — create a new ExportVersion for an EditTask
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

  let body: CreateVersionBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { label, url, notes } = body;

  if (!label || !url) {
    return NextResponse.json(
      { error: "label and url are required" },
      { status: 400 }
    );
  }

  const validLabels: VersionLabel[] = [
    "DRAFT_1",
    "DRAFT_2",
    "CLIENT_REVISION",
    "FINAL_APPROVED",
    "PUBLISHED_EXPORT",
  ];
  if (!validLabels.includes(label)) {
    return NextResponse.json(
      { error: `label must be one of: ${validLabels.join(", ")}` },
      { status: 400 }
    );
  }

  try {
    const editTask = await db.editTask.findUnique({ where: { id } });
    if (!editTask) {
      return NextResponse.json({ error: "EditTask not found" }, { status: 404 });
    }

    const version = await db.exportVersion.create({
      data: {
        editTaskId: id,
        deliverableId: editTask.deliverableId,
        label,
        url,
        notes: notes ?? null,
        uploadedBy: userId,
      },
    });

    await db.activityLog.create({
      data: {
        deliverableId: editTask.deliverableId,
        userId,
        action: "export_version_created",
        meta: {
          editTaskId: id,
          versionId: version.id,
          label,
        },
      },
    });

    return NextResponse.json({ version }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/v2/editing/[id]/versions]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
