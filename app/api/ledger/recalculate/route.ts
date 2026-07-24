import { NextResponse } from "next/server";
import { getSession, hasPermission } from "@/lib/auth";
import {
  recalculateDiamondLedger,
  recalculateGoldLedger,
} from "@/lib/ledger-recalc";

/**
 * POST /api/ledger/recalculate
 * Body (form): kind=gold|diamond|all
 *
 * Rewrites the running-balance snapshots on every ledger entry so they
 * reflect the true chronological state. Use after editing historical
 * purchase or karigar-issue records. Requires SETTINGS_EDIT (highest-trust
 * permission available today — swap for a dedicated LEDGER_RECALC once
 * that permission is seeded).
 */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session || !hasPermission(session, "SETTINGS_EDIT")) {
    return NextResponse.json(
      { ok: false, message: "Not authorised." },
      { status: 403 }
    );
  }

  const form = await request.formData();
  const kind = String(form.get("kind") ?? "all").toLowerCase();

  try {
    const results: Record<string, unknown> = {};
    if (kind === "gold" || kind === "all") {
      results.gold = await recalculateGoldLedger();
    }
    if (kind === "diamond" || kind === "all") {
      results.diamond = await recalculateDiamondLedger();
    }
    if (!Object.keys(results).length) {
      return NextResponse.json(
        { ok: false, message: "Unknown kind. Use gold | diamond | all." },
        { status: 400 }
      );
    }
    return NextResponse.json({ ok: true, results });
  } catch (err) {
    console.error("[ledger recalc] error", err);
    return NextResponse.json(
      {
        ok: false,
        message:
          err instanceof Error ? err.message : "Ledger recalculation failed.",
      },
      { status: 500 }
    );
  }
}
