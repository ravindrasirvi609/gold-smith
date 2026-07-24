import { NextResponse } from "next/server";
import { getSession, revokeSession } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * DELETE /api/sessions/[id]
 *
 * Revoke one session belonging to the current user. Users can only revoke
 * their own sessions — admins revoking someone else's should use the
 * separate /api/users/[id]/force-logout endpoint.
 */
export async function DELETE(_: Request, { params }: RouteParams) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { ok: false, message: "Not authenticated." },
      { status: 401 }
    );
  }
  const { id } = await params;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json(
      { ok: false, message: "Invalid session id." },
      { status: 400 }
    );
  }
  const db = await getDb();
  const target = await db
    .collection("sessions")
    .findOne({ _id: new ObjectId(id) });
  if (!target) {
    return NextResponse.json({ ok: false, message: "Not found." }, { status: 404 });
  }
  if (String(target.userId) !== session.userId) {
    return NextResponse.json(
      { ok: false, message: "You can only revoke your own sessions." },
      { status: 403 }
    );
  }
  await revokeSession(id);
  return NextResponse.json({ ok: true, id });
}
