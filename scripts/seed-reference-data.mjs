/**
 * Seed the `referenceData` collection with the editable catalogs.
 *
 * Run once after a fresh install (or any time you want to reset the
 * options back to Gold-Smith's defaults) via:
 *
 *   npm run seed:reference-data
 *
 * Existing rows are left untouched — `upsert` sets only-on-insert, so
 * a shop owner's custom sub-categories or specializations survive re-runs.
 */

import "dotenv/config";
import { MongoClient } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME ?? "gold-smith";

if (!MONGODB_URI) {
  console.error("Missing MONGODB_URI environment variable.");
  process.exit(1);
}

/**
 * Default rows to insert. Mirrors STATIC_EDITABLE_SEED in
 * lib/reference-data.ts — keep them in sync when you extend either side.
 */
const SEED = {
  "jewellery-subcategory": [
    // Rings
    { value: "SOLITAIRE", label: "Solitaire", parent: "RING" },
    { value: "ENGAGEMENT", label: "Engagement", parent: "RING" },
    { value: "WEDDING_BAND", label: "Wedding band", parent: "RING" },
    { value: "COCKTAIL", label: "Cocktail", parent: "RING" },
    { value: "SIGNET", label: "Signet", parent: "RING" },
    { value: "ETERNITY", label: "Eternity", parent: "RING" },
    { value: "COUPLE", label: "Couple ring", parent: "RING" },
    // Necklaces
    { value: "CHOKER", label: "Choker", parent: "NECKLACE" },
    { value: "MATINEE", label: "Matinee", parent: "NECKLACE" },
    { value: "OPERA", label: "Opera", parent: "NECKLACE" },
    { value: "RANI_HAAR", label: "Rani haar", parent: "NECKLACE" },
    { value: "BRIDAL_N", label: "Bridal necklace", parent: "NECKLACE" },
    { value: "TEMPLE_N", label: "Temple necklace", parent: "NECKLACE" },
    // Chains
    { value: "ROPE", label: "Rope chain", parent: "CHAIN" },
    { value: "BOX", label: "Box chain", parent: "CHAIN" },
    { value: "CURB", label: "Curb chain", parent: "CHAIN" },
    { value: "FIGARO", label: "Figaro chain", parent: "CHAIN" },
    { value: "SNAKE", label: "Snake chain", parent: "CHAIN" },
    { value: "BEAD", label: "Bead chain", parent: "CHAIN" },
    { value: "WHEAT", label: "Wheat chain", parent: "CHAIN" },
    // Bangles
    { value: "PLAIN_B", label: "Plain bangle", parent: "BANGLE" },
    { value: "KADA_STYLE", label: "Kada style bangle", parent: "BANGLE" },
    { value: "BRIDAL_SET_B", label: "Bridal bangle set", parent: "BANGLE" },
    { value: "ANTIQUE_B", label: "Antique bangle", parent: "BANGLE" },
    { value: "TEMPLE_B", label: "Temple bangle", parent: "BANGLE" },
    { value: "OPENABLE", label: "Openable bangle", parent: "BANGLE" },
    // Earrings
    { value: "STUD", label: "Stud earring", parent: "EARRING" },
    { value: "HOOP", label: "Hoop / bali", parent: "EARRING" },
    { value: "DROP", label: "Drop / dangler", parent: "EARRING" },
    { value: "JHUMKA", label: "Jhumka", parent: "EARRING" },
    { value: "CHANDBALI", label: "Chandbali", parent: "EARRING" },
    { value: "EAR_CUFF", label: "Ear cuff", parent: "EARRING" },
    // Pendants
    { value: "PEND_SOLITAIRE", label: "Solitaire pendant", parent: "PENDANT" },
    { value: "PEND_RELIGIOUS", label: "Religious pendant", parent: "PENDANT" },
    { value: "PEND_LETTER", label: "Initial / letter pendant", parent: "PENDANT" },
    { value: "PEND_HEART", label: "Heart pendant", parent: "PENDANT" },
    { value: "PEND_CLUSTER", label: "Cluster pendant", parent: "PENDANT" },
    // Mangalsutra
    { value: "MS_SHORT", label: "Short mangalsutra", parent: "MANGALSUTRA" },
    { value: "MS_LONG", label: "Long mangalsutra", parent: "MANGALSUTRA" },
    { value: "MS_MAHA", label: "Maharashtrian mangalsutra", parent: "MANGALSUTRA" },
    { value: "MS_DIAMOND", label: "Diamond mangalsutra", parent: "MANGALSUTRA" },
    // Sets
    { value: "SET_BRIDAL", label: "Bridal jewellery set", parent: "SET" },
    { value: "SET_PARTY", label: "Party set", parent: "SET" },
    { value: "SET_TEMPLE", label: "Temple set", parent: "SET" },
    { value: "SET_MEENAKARI", label: "Meenakari set", parent: "SET" },
    // Coins
    { value: "COIN_GOLD", label: "Gold coin", parent: "COIN" },
    { value: "COIN_SILVER", label: "Silver coin", parent: "COIN" },
    { value: "COIN_BAR", label: "Bullion bar", parent: "COIN" },
  ],
  "karigar-specialization": [
    { value: "RING", label: "Ring maker" },
    { value: "CHAIN", label: "Chain specialist" },
    { value: "STONE_SETTING", label: "Stone setter" },
    { value: "POLISHING", label: "Polisher" },
    { value: "FILING", label: "Filer" },
    { value: "ENAMELING", label: "Enameling / meenakari" },
    { value: "KUNDAN", label: "Kundan work" },
    { value: "ANTIQUE", label: "Antique work" },
    { value: "BALI", label: "Bali maker" },
    { value: "PLATING", label: "Plating" },
    { value: "CASTING", label: "Casting" },
    { value: "CAD", label: "CAD / CAM designer" },
    { value: "HAND", label: "Hand-crafted / bespoke" },
    { value: "MOULD", label: "Mould maker" },
  ],
  "sale-type": [
    { value: "RETAIL", label: "Retail" },
    { value: "WHOLESALE", label: "Wholesale" },
    { value: "OLD_GOLD_EXCHANGE", label: "Old gold exchange" },
    { value: "REPAIR", label: "Repair charge" },
    { value: "INSTITUTIONAL", label: "Institutional / bulk" },
    { value: "SCHEME_REDEMPTION", label: "Scheme / SIP redemption" },
  ],
  "approval-purpose": [
    { value: "HOME_TRIAL", label: "Home trial" },
    { value: "FUNCTION", label: "Function / wedding" },
    { value: "COMPARISON", label: "For comparison" },
    { value: "REPAIR_ESTIMATE", label: "Repair estimate" },
    { value: "PHOTOSHOOT", label: "Photoshoot" },
    { value: "OTHER", label: "Other" },
  ],
};

async function main() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  try {
    const db = client.db(MONGODB_DB_NAME);
    const collection = db.collection("referenceData");

    // Idempotent unique index. `createIndex` is a no-op if the index
    // already exists with the same spec.
    await collection.createIndex(
      { kind: 1, value: 1 },
      { unique: true, name: "kind_value_unique" }
    );

    const now = new Date();
    let inserted = 0;

    for (const [kind, rows] of Object.entries(SEED)) {
      for (const row of rows) {
        const result = await collection.updateOne(
          { kind, value: row.value },
          {
            $set: {
              kind,
              value: row.value,
              label: row.label,
              parent: row.parent ?? null,
              isActive: true,
              updatedAt: now,
            },
            $setOnInsert: {
              createdAt: now,
              seededDefault: true,
            },
          },
          { upsert: true }
        );
        if (result.upsertedCount > 0) inserted++;
      }
    }

    const totalRows = Object.values(SEED).reduce((n, arr) => n + arr.length, 0);
    console.log(
      `Reference data seed complete — ${inserted} new row(s) inserted, ${totalRows - inserted} already present.`
    );
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
