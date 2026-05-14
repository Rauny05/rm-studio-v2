import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { transitionDeliverable, canTransition } from "@/lib/workflow/engine";
import type { DeliverableStatus, Role } from "@prisma/client";

type Params = { params: Promise<{ id: string }> };

// POST /api/v2/deliverables/[id]/transition
// Body: { toStatus: DeliverableStatus, meta?: object }
export async function POST(req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { toStatus, meta } = body as {
    toStatus: DeliverableStatus;
    meta?: Record<string, unknown>;
  };

  if (!toStatus) {
    return NextResponse.json({ error: "toStatus is required" }, { status: 400 });
  }

  const userRole = (session.user as { role: Role }).role;

  // Check role permission for this transition
  if (!canTransition(userRole, toStatus)) {
    return NextResponse.json(
      { error: `Role ${userRole} cannot transition to ${toStatus}` },
      { status: 403 }
    );
  }

  try {
    await transitionDeliverable(id, toStatus, session.user.id!, meta);
    return NextResponse.json({ ok: true, toStatus });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Transition failed";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
