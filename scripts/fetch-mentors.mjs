// scripts/fetch-mentors.mjs
//
// Fetches mentor records from Airtable and writes them to mentors.json
// at the repo root. Run by the GitHub Actions workflow on an hourly
// schedule — the Airtable token only ever exists inside that workflow
// run (as a GitHub Actions secret), never in the browser or the repo.

const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_TABLE_NAME = process.env.AIRTABLE_TABLE_NAME || "Mentors";
const AIRTABLE_VIEW_NAME = process.env.AIRTABLE_VIEW_NAME; // optional but recommended

if (!AIRTABLE_TOKEN || !AIRTABLE_BASE_ID) {
  console.error("Missing AIRTABLE_TOKEN or AIRTABLE_BASE_ID environment variables.");
  process.exit(1);
}

// If a view is set, that view's own sort order (configured in Airtable's
// UI) is used, so no sort param is sent here at all — the view is the
// single source of truth for ordering. If no view is set, fall back to
// sorting by Name, since that's guaranteed to exist (Name is required
// for a mentor to appear at all — see the filter below).
const params = new URLSearchParams({ pageSize: "100" });
if (AIRTABLE_VIEW_NAME) {
  params.set("view", AIRTABLE_VIEW_NAME);
} else {
  params.set("sort[0][field]", "Name");
  params.set("sort[0][direction]", "asc");
}

const url =
  `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE_NAME)}` +
  `?${params.toString()}`;

async function main() {
  const resp = await fetch(url, {
    headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` },
  });

  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Airtable request failed (${resp.status}): ${body}`);
  }

  const data = await resp.json();

  const mentors = (data.records || [])
    .map((r) => ({
      name: r.fields.Name || "",
      role: r.fields.Role || "",
      slug: r.fields.Slug || "",
      active: r.fields.Active !== false, // treat missing checkbox as active
    }))
    .filter((m) => m.name && m.slug && m.active)
    .map(({ name, role, slug }) => ({ name, role, slug }));

  const output = {
    mentors,
    generatedAt: new Date().toISOString(),
  };

  const fs = await import("node:fs/promises");
  await fs.writeFile("mentors.json", JSON.stringify(output, null, 2) + "\n");

  console.log(`Wrote mentors.json with ${mentors.length} active mentor(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});