// Reads coverage.xlsx at build time and emits a cleaned JSON file the
// Next.js app imports. Runs automatically on `npm run dev` and `npm run build`
// via the "predev" / "prebuild" hooks in package.json.
//
// To update the site: edit coverage.xlsx, commit it, push to GitHub. Vercel
// reruns this script on the next deploy. No code changes required.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as XLSX from "xlsx";
import { COUNTRY_ALIASES } from "../lib/countryMapping.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const XLSX_PATH = path.join(ROOT, "coverage.xlsx");
const OUT_DIR = path.join(ROOT, "lib", "data");
const OUT_PATH = path.join(OUT_DIR, "coverage.json");

const REGULATORS_SHEET = "Regulatory Coverage - Other";
const RULEBOOKS_SHEET = "Consolidated rulebook regulator";
const EXCHANGES_SHEET = "Exchanges";
const LEGISLATION_SHEET = "Legislation";
const PRICING_SHEET = "Pricing SKUs";

// Flat bundle add-ons layered on top of the SKU sheet. These aren't priced
// per-item — customers toggle the whole bundle on for a single annual fee.
// Change the price here if it ever shifts.
const BUNDLE_ADDONS = [
  {
    family: "Consolidated Rulebooks",
    unit: "bundle",
    tier: "Rulebooks bundle",
    label: "Consolidated Rulebooks bundle add-on",
    sku: "SUBS_PL_RB_ADD",
    delivery: "Bundled reference content",
    price: 5000,
    isCustom: false,
    threshold: null,
    overFloor: null,
    notes: null,
    isBundle: true,
    bundleKey: "rulebooks",
  },
  {
    family: "Exchanges",
    unit: "bundle",
    tier: "Exchanges bundle",
    label: "Exchanges bundle add-on",
    sku: "SUBS_PL_EX_ADD",
    delivery: "Bundled exchange rules",
    price: 5000,
    isCustom: false,
    threshold: null,
    overFloor: null,
    notes: null,
    isBundle: true,
    bundleKey: "exchanges",
  },
];

// Canonical US state (and DC / PR) names used for both jurisdiction lookup
// and for scanning regulator names to infer federal vs state.
const US_STATE_CANONICAL = [
  "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut",
  "Delaware","District of Columbia","Florida","Georgia","Hawaii","Idaho",
  "Illinois","Indiana","Iowa","Kansas","Kentucky","Louisiana","Maine",
  "Maryland","Massachusetts","Michigan","Minnesota","Mississippi","Missouri",
  "Montana","Nebraska","Nevada","New Hampshire","New Jersey","New Mexico",
  "New York","North Carolina","North Dakota","Ohio","Oklahoma","Oregon",
  "Pennsylvania","Puerto Rico","Rhode Island","South Carolina","South Dakota",
  "Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia",
  "Wisconsin","Wyoming",
];

const US_STATE_NAMES = new Set([
  ...US_STATE_CANONICAL.map((s) => s.toLowerCase()),
  // common truncations present in the spreadsheet
  "nevada de","nevada se","new hamps","new jerse","new mexic","ohio depa",
]);

// Word-boundary regex matching any US state name as a complete phrase in a
// regulator name. Longer multi-word states come first so "North Carolina"
// wins before "Carolina" would partial-match (not needed with \b anchors,
// but defensive).
const US_STATE_IN_NAME_RE = new RegExp(
  "\\b(" +
    [...US_STATE_CANONICAL].sort((a, b) => b.length - a.length).join("|") +
    ")\\b",
  "i"
);

// Map of truncated state strings that appear in the spreadsheet back to the
// canonical state name. Used for both jurisdiction normalization and
// state-level grouping in the drawer.
const US_STATE_TRUNCATIONS = {
  "nevada de": "Nevada",
  "nevada se": "Nevada",
  "new hamps": "New Hampshire",
  "new jerse": "New Jersey",
  "new mexic": "New Mexico",
  "ohio depa": "Ohio",
};

// Extract the US state for an entry whose country is United States.
// Prefers an explicit state-named jurisdiction column; falls back to scanning
// the regulator / publisher name. Returns the canonical state name or null.
function extractUSState(rawJurisdiction, name) {
  const j = clean(rawJurisdiction).toLowerCase();
  if (US_STATE_TRUNCATIONS[j]) return US_STATE_TRUNCATIONS[j];
  const exact = US_STATE_CANONICAL.find((s) => s.toLowerCase() === j);
  if (exact) return exact;
  if (name) {
    const m = name.match(US_STATE_IN_NAME_RE);
    if (m) return m[1];
  }
  return null;
}

// Derive whether an entry represents a federal or state-level jurisdiction.
// For US entries: if the regulator/publisher NAME mentions a state, treat it
// as state-level — otherwise federal. The spreadsheet tags most US
// regulators with jurisdiction "United States" regardless of whether they
// are state or federal, so we have to read the name.
function deriveLevel(rawJurisdiction, country, name) {
  const j = clean(rawJurisdiction).toLowerCase();
  if (!j) return null;
  if (j === "us fed" || j === "canada fed" || j === "mexico fed") return "federal";
  if (country === "United States") {
    if (US_STATE_NAMES.has(j)) return "state";
    if (j === "united states" || j === "united states of america") {
      if (name && US_STATE_IN_NAME_RE.test(name)) return "state";
      return "federal";
    }
  }
  return null;
}

function clean(value) {
  if (value == null) return "";
  return String(value).replace(/\s+/g, " ").trim();
}

function normalizeJurisdiction(raw) {
  const cleaned = clean(raw);
  if (!cleaned) return { display: "", country: "", iso3: null };
  const lower = cleaned.toLowerCase();
  const match = COUNTRY_ALIASES[lower];
  if (match) {
    return { display: cleaned, country: match.country, iso3: match.iso3 };
  }
  // Unknown jurisdiction — keep as-is, no country mapping. It will still
  // show up in the directory, just not on the map.
  return { display: cleaned, country: cleaned, iso3: null };
}

// The spreadsheet uses AMER / APAC / EMEA / INT on one sheet and a mix of
// US / Canada / Europe / Asia / Oceania / Middle East / Latin Am on another.
// Normalize to four buckets the UI can filter on.
function normalizeRegion(sheetRegion, iso3, country) {
  const r = clean(sheetRegion).toLowerCase();
  if (!r) return guessRegionFromIso(iso3, country) ?? "Global";
  if (r === "amer" || r === "us" || r === "canada" || r === "latin am" || r === "mexico" || r === "caribbean") {
    return "Americas";
  }
  if (r === "apac" || r === "asia" || r === "oceania") return "APAC";
  if (r === "emea" || r === "europe" || r === "middle east" || r === "africa") return "EMEA";
  if (r === "int" || r === "international") return "Global";
  return guessRegionFromIso(iso3, country) ?? "Global";
}

function guessRegionFromIso(iso3, country) {
  if (!iso3) return null;
  const AMERICAS = new Set(["USA","CAN","MEX","BRA","ARG","CHL","COL","PER","URY","VEN","DOM","CUB","CRI","PAN","GTM","HND","SLV","NIC","PRY","ECU","BOL","BMU","BHS","BRB","JAM","TTO","CYM","VGB"]);
  const APAC = new Set(["AUS","NZL","JPN","KOR","CHN","HKG","TWN","SGP","MYS","THA","IDN","PHL","VNM","IND","PAK","BGD","LKA","NPL","MMR","KHM","LAO","MNG","BTN","MDV","FJI","PNG","COK"]);
  const EMEA = new Set(["GBR","IRL","FRA","DEU","ITA","ESP","PRT","NLD","BEL","LUX","CHE","AUT","SWE","NOR","DNK","FIN","ISL","POL","CZE","SVK","HUN","ROU","BGR","GRC","HRV","SVN","EST","LVA","LTU","MLT","CYP","MCO","LIE","AND","SMR","VAT","TUR","ISR","SAU","ARE","QAT","BHR","KWT","OMN","JOR","LBN","EGY","MAR","TUN","DZA","LBY","ZAF","NGA","KEN","GHA","RUS","UKR","BLR","SRB","MKD","ALB","BIH","MNE","XKX"]);
  if (AMERICAS.has(iso3)) return "Americas";
  if (APAC.has(iso3)) return "APAC";
  if (EMEA.has(iso3)) return "EMEA";
  return null;
}

function readSheet(wb, name) {
  const ws = wb.Sheets[name];
  if (!ws) throw new Error(`Missing sheet: "${name}"`);
  return XLSX.utils.sheet_to_json(ws, { defval: "", raw: true });
}

// The Pricing SKUs sheet has data in the header row (no real header), so we
// read raw arrays. Layout per row:
//   [0] family (sticky — blank means same as previous row)
//   [1] tier label ("Regulatory Content - up to 30 Regulators")
//   [2] SKU code
//   [3] delivery notes
//   [7] price (number, or the string "Custom")
//   [8] optional notes (e.g. "manually entered")
function readPricing(wb) {
  const ws = wb.Sheets[PRICING_SHEET];
  if (!ws) return [];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "", raw: true });
  const out = [];
  let lastFamily = "";
  for (const row of rows) {
    if (!row || row.length === 0) continue;
    const familyRaw = clean(row[0]);
    const label = clean(row[1]);
    const sku = clean(row[2]);
    const delivery = clean(row[3]);
    const priceCell = row[7];
    const notes = clean(row[8]);
    if (!label && !sku) continue; // blank spacer row
    if (familyRaw) lastFamily = familyRaw;
    const family = lastFamily;
    if (!family) continue;

    // Tier label "Regulatory Content - up to 30 Regulators" → tier text after
    // the dash, plus a numeric threshold we can drive the slider from.
    const dash = label.indexOf(" - ");
    const tier = dash >= 0 ? label.slice(dash + 3).trim() : label;

    // "up to 30 Regulators" → 30; ">60 Regulators" → null + isOver=true
    const upToMatch = tier.match(/up to (\d+)/i);
    const overMatch = tier.match(/^>(\d+)/);
    const threshold = upToMatch ? Number(upToMatch[1]) : null;
    const overFloor = overMatch ? Number(overMatch[1]) : null;

    const isCustom =
      typeof priceCell === "string" && priceCell.toLowerCase() === "custom";
    const price = isCustom
      ? null
      : typeof priceCell === "number"
        ? priceCell
        : null;

    const unit = family.toLowerCase().startsWith("legisla")
      ? "jurisdictions"
      : "regulators";

    out.push({
      family,
      unit,
      tier,
      label,
      sku,
      delivery: delivery || null,
      price,
      isCustom,
      threshold,
      overFloor,
      notes: notes || null,
    });
  }
  return out;
}

function build() {
  if (!fs.existsSync(XLSX_PATH)) {
    throw new Error(`Cannot find coverage.xlsx at ${XLSX_PATH}`);
  }
  // SheetJS ESM build doesn't wire up Node fs for readFile — read the bytes
  // ourselves and pass them in.
  const buf = fs.readFileSync(XLSX_PATH);
  const wb = XLSX.read(buf, { type: "buffer" });

  const regulators = readSheet(wb, REGULATORS_SHEET)
    .map((row) => {
      const name = clean(row["Regulator Name"]);
      if (!name) return null;
      const rawJ = row["Jurisdicition"] || row["Jurisdiction"];
      const { display, country, iso3 } = normalizeJurisdiction(rawJ);
      const level = deriveLevel(rawJ, country, name);
      const stateName =
        country === "United States" && level === "state"
          ? extractUSState(rawJ, name)
          : null;
      return {
        tier: "regulators",
        name,
        jurisdiction: stateName || display,
        country,
        iso3,
        region: normalizeRegion(row["Region"], iso3, country),
        level,
      };
    })
    .filter(Boolean);

  const rulebooks = readSheet(wb, RULEBOOKS_SHEET)
    .map((row) => {
      const name = clean(row["publisher_names"] || row["Publisher"] || row["Publisher Name"]);
      if (!name) return null;
      const rawJ = row["Jurisdiction"];
      const { display, country, iso3 } = normalizeJurisdiction(rawJ);
      const level = deriveLevel(rawJ, country, name);
      const stateName =
        country === "United States" && level === "state"
          ? extractUSState(rawJ, name)
          : null;
      return {
        tier: "rulebooks",
        name,
        jurisdiction: stateName || display,
        country,
        iso3,
        region: normalizeRegion(row["Region 1"], iso3, country),
        level,
      };
    })
    .filter(Boolean);

  const exchanges = readSheet(wb, EXCHANGES_SHEET)
    .map((row) => {
      const name = clean(row["Exchange"]);
      if (!name) return null;
      const rawJ = row["Country"];
      const { display, country, iso3 } = normalizeJurisdiction(rawJ);
      const category = clean(row["Permissions Requirement Category"]);
      const level = deriveLevel(rawJ, country, name);
      const stateName =
        country === "United States" && level === "state"
          ? extractUSState(rawJ, name)
          : null;
      return {
        tier: "exchanges",
        name,
        jurisdiction: stateName || display,
        country,
        iso3,
        region: normalizeRegion(null, iso3, country),
        level,
        size: clean(row["Size"]) || null,
        stockExchange: clean(row["Stock exchange"]) === "Y",
        permissionsCategory: category || null,
      };
    })
    .filter(Boolean);

  const legislation = readSheet(wb, LEGISLATION_SHEET)
    .map((row) => {
      const name = clean(row["Legislature"] || row["Legislature Name"]);
      if (!name) return null;
      const rawJ = row["Jurisdiction"];
      // Legislation sheet is US-scoped: if the jurisdiction names a US state
      // (including ambiguous names like "Georgia") or the federal marker,
      // force it onto the United States so the map and drill-down work.
      const rawJLower = clean(rawJ).toLowerCase();
      const isUS =
        rawJLower === "us fed" ||
        rawJLower === "united states" ||
        US_STATE_NAMES.has(rawJLower);
      const { display, country, iso3 } = isUS
        ? { display: clean(rawJ), country: "United States", iso3: "USA" }
        : normalizeJurisdiction(rawJ);
      // Prefer the sheet's explicit Level column, fall back to inference.
      const declared = clean(row["Level"]).toLowerCase();
      const level =
        declared === "federal" || declared === "state"
          ? declared
          : deriveLevel(rawJ, country, name);
      const stateName =
        country === "United States" && level === "state"
          ? extractUSState(rawJ, name)
          : null;
      return {
        tier: "legislation",
        name,
        jurisdiction: stateName || display,
        country,
        iso3,
        region: normalizeRegion(null, iso3, country),
        level,
      };
    })
    .filter(Boolean);

  // Country-level aggregates for map shading.
  const byIso = {};
  const countAll = (entry) => {
    if (!entry.iso3) return;
    const k = entry.iso3;
    if (!byIso[k]) {
      byIso[k] = {
        iso3: k,
        country: entry.country,
        regulators: 0,
        rulebooks: 0,
        exchanges: 0,
        legislation: 0,
        total: 0,
      };
    }
    byIso[k][entry.tier] += 1;
    byIso[k].total += 1;
  };
  regulators.forEach(countAll);
  rulebooks.forEach(countAll);
  exchanges.forEach(countAll);
  legislation.forEach(countAll);

  // Unmapped jurisdictions — surface them so we can improve COUNTRY_ALIASES.
  const unmapped = new Set();
  [...regulators, ...rulebooks, ...exchanges, ...legislation].forEach((e) => {
    if (!e.iso3 && e.jurisdiction) unmapped.add(e.jurisdiction);
  });

  const summary = {
    regulators: regulators.length,
    rulebooks: rulebooks.length,
    exchanges: exchanges.length,
    legislation: legislation.length,
    jurisdictions: Object.keys(byIso).length,
    builtAt: new Date().toISOString(),
  };

  const pricing = [...readPricing(wb), ...BUNDLE_ADDONS];

  const out = {
    summary,
    regulators,
    rulebooks,
    exchanges,
    legislation,
    byIso,
    unmapped: [...unmapped].sort(),
    pricing,
  };

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(out, null, 2));

  const parts = [
    `Coverage data built:`,
    `  regulators:    ${summary.regulators}`,
    `  rulebooks:     ${summary.rulebooks}`,
    `  legislation:   ${summary.legislation}`,
    `  exchanges:     ${summary.exchanges}`,
    `  countries:     ${summary.jurisdictions}`,
    `  pricing SKUs:  ${pricing.length}`,
  ];
  if (unmapped.size > 0) {
    parts.push(`  unmapped names: ${unmapped.size} (see lib/data/coverage.json → unmapped)`);
  }
  console.log(parts.join("\n"));
}

build();
