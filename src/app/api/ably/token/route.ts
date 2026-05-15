import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAblyServer } from "@/lib/ably";

// GET /api/ably/token — issue an Ably token request for the authenticated user
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ably = getAblyServer();
  if (!ably) {
    return NextResponse.json(
      { error: "Ably not configured" },
      { status: 503 }
    );
  }

  try {
    const tokenRequest = await ably.auth.createTokenRequest({
      clientId: session.user.id,
      capability: {
        [`notifications:${session.user.id}`]: ["subscribe"],
      },
    });
    return NextResponse.json(tokenRequest);
  } catch (err) {
    console.error("[ably/token]", err);
    return NextResponse.json({ error: "Token generation failed" }, { status: 500 });
  }
}
