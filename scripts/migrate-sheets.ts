/**
 * migrate-sheets.ts
 * Migrates existing Google Sheets deliverables data into PostgreSQL.
 * Run once: npx tsx scripts/migrate-sheets.ts
 */

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const SHEET_ID = "1PImkkw3DEsbZ8Vaveqmc-nyPkP_xQhoAGfesPeE1_fY";
const SHEET_GID = "1182035153";

// ── CSV parser (ported from existing route) ────────────────────────────────────

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let current: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') { field += '"'; i++; }
      else if (char === '"') { inQuotes = false; }
      else { field += char; }
    } else {
      if (char === '"') { inQuotes = true; }
      else if (char === ",") { current.push(field); field = ""; }
      else if (char === "\n") {
        current.push(field); field = "";
        rows.push(current); current = [];
      } else if (char !== "\r") { field += char; }
    }
  }
  if (current.length > 0 || field) { current.push(field); rows.push(current); }
  return rows;
}

function parsePOC(raw: string) {
  const parts = raw.split(" - ");
  return { pocName: parts[0]?.trim() ?? "", pocCompany: parts.slice(1).join(" - ").trim() };
}

// ── Main migration ────────────────────────────────────────────────────────────

async function main() {
  console.log("🔄 Fetching Google Sheets data...");

  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${SHEET_GID}`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Failed to fetch sheet: ${res.status}`);
  }

  const text = await res.text();
  const rows = parseCSV(text);

  console.log(`📊 Found ${rows.length - 1} data rows`);

  let created = 0;
  let skipped = 0;

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length < 3) continue;

    const pnNo = (row[0] ?? "").trim();
    if (!pnNo || !/^[a-z]{2}\d{2}-\d+/i.test(pnNo)) continue;

    const brand = (row[1] ?? "").trim();
    if (!brand) continue;

    const pocRaw = (row[3] ?? "").trim();
    const emailSent = (row[4] ?? "").trim().toLowerCase() === "yes";
    const advance50 = (row[5] ?? "").trim().toLowerCase() === "yes";
    const payment100 = (row[6] ?? "").trim().toLowerCase() === "yes";
    const invoiceNumber = (row[7] ?? "").trim() || null;
    const notes = (row[8] ?? "").trim() || null;

    const { pocName, pocCompany } = parsePOC(pocRaw);

    // Determine status from payment pipeline
    let status: "DRAFT" | "ACTIVE" | "PUBLISHED" | "ARCHIVED" = "ACTIVE";
    if (payment100) status = "PUBLISHED";
    else if (!emailSent && !advance50) status = "DRAFT";

    try {
      await db.deliverable.upsert({
        where: { pnNo },
        create: {
          pnNo,
          title: brand, // Use brand as title initially — user can update
          brand,
          type: "BRAND_INTEGRATION",
          status,
          priority: "MEDIUM",
          pocName: pocName || null,
          pocCompany: pocCompany || null,
          emailSent,
          advance50,
          payment100,
          invoiceNumber,
          notes,
        },
        update: {
          // Only update financial fields on re-run
          emailSent,
          advance50,
          payment100,
          invoiceNumber,
          notes,
        },
      });
      created++;
      console.log(`  ✅ ${pnNo} — ${brand}`);
    } catch (err) {
      console.error(`  ❌ ${pnNo} — ${brand}:`, err);
      skipped++;
    }
  }

  console.log(`\n✨ Migration complete: ${created} upserted, ${skipped} failed`);
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
