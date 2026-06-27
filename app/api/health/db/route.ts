import { NextResponse } from "next/server";
import { getDb, dbName } from "@/lib/mongodb";

export async function GET() {
  try {
    const db = await getDb();
    const result = await db.command({ ping: 1 });

    return NextResponse.json({
      ok: true,
      dbName,
      ping: result.ok === 1,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown database error";

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
