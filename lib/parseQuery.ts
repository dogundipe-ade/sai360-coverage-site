// Parses plain-language coverage queries like:
//   "show me all regulators in canada and mexico"
//   "federal agencies in the us"
//   "california state regulators"
//   "exchanges in apac"
//
// Extracts structured filters (tiers, regions, countries, US states, levels)
// via greedy longest-phrase matching, and returns the leftover tokens as
// free-text for fuzzy name matching.

import type { CoverageEntry, Level, Region, Tier } from "./types";

const TIER_KEYWORDS: Record<Tier, string[]> = {
  regulators: [
    "regulators", "regulator", "agencies", "agency",
    "authorities", "authority", "regulatory",
  ],
  rulebooks: ["rulebooks", "rulebook", "rules"],
  legislation: [
    "legislatures", "legislature", "legislation", "legislative",
    "laws", "law", "statutes", "statute", "bills", "congresses", "congress",
    "lawmakers", "lawmaker", "parliaments", "parliament",
  ],
  exchanges: ["exchanges", "exchange", "bourse", "bourses"],
};

const TIER_MAP: Record<string, Tier> = {};
for (const tier of Object.keys(TIER_KEYWORDS) as Tier[]) {
  for (const kw of TIER_KEYWORDS[tier]) TIER_MAP[kw] = tier;
}

const REGION_KEYWORDS: Record<Region, string[]> = {
  Americas: ["americas", "america"],
  EMEA: ["emea", "europe", "european", "african", "middle east"],
  APAC: ["apac", "asia", "asian", "oceania", "pacific", "asia pacific"],
  Global: ["global", "worldwide", "international"],
};

const REGION_MAP: Record<string, Region> = {};
for (const region of Object.keys(REGION_KEYWORDS) as Region[]) {
  for (const kw of REGION_KEYWORDS[region]) REGION_MAP[kw] = region;
}

const LEVEL_MAP: Record<string, Level> = {
  federal: "federal",
  federally: "federal",
  fed: "federal",
  state: "state",
  states: "state",
  statewide: "state",
  "state-level": "state",
};

// Short aliases and demonyms. Full country names (e.g. "Switzerland",
// "Netherlands") come from the live `byIso` data and are injected at parse
// time — we don't duplicate them here.
const COUNTRY_ALIASES: Record<string, string> = {
  us: "USA", usa: "USA",
  america: "USA", american: "USA",
  "united states": "USA",
  "united states of america": "USA",
  uk: "GBR",
  britain: "GBR", british: "GBR",
  england: "GBR", english: "GBR",
  "great britain": "GBR",
  "united kingdom": "GBR",
  uae: "ARE", emirates: "ARE",
  canadian: "CAN",
  mexican: "MEX",
  brazilian: "BRA",
  australian: "AUS", aussie: "AUS",
  japanese: "JPN",
  german: "DEU",
  french: "FRA",
  spanish: "ESP",
  italian: "ITA",
  swiss: "CHE",
  dutch: "NLD", holland: "NLD",
  irish: "IRL",
  korea: "KOR",
  korean: "KOR",
  "south korea": "KOR",
  "south korean": "KOR",
  "hong kong": "HKG",
  singaporean: "SGP",
  "south africa": "ZAF",
  "south african": "ZAF",
  "new zealand": "NZL",
};

const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado",
  "Connecticut", "Delaware", "District of Columbia", "Florida", "Georgia",
  "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky",
  "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota",
  "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire",
  "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota",
  "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Puerto Rico", "Rhode Island",
  "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont",
  "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming",
];

const STATE_MAP: Record<string, string> = {};
for (const s of US_STATES) STATE_MAP[s.toLowerCase()] = s;

// Words the user naturally types but that don't encode filter intent.
// Consumed silently instead of becoming free-text noise for Fuse.
const FILLER_WORDS = new Set([
  "the", "a", "an", "of", "for", "in", "on", "at", "to", "and", "or",
  "vs", "all", "both", "any", "show", "list", "find", "give", "me",
  "please", "with", "by", "coverage", "data", "content", "tell", "do",
  "does", "which", "what", "who", "whose", "is", "are", "based", "about",
  "our", "we", "track", "tracking", "covered", "have",
]);

export interface ParsedQuery {
  tiers: Set<Tier>;
  regions: Set<Region>;
  countries: Set<string>;
  states: Set<string>;
  levels: Set<Level>;
  freeText: string;
  hasStructure: boolean;
}

export function parseQuery(
  raw: string,
  countryNameToIso3: Record<string, string>
): ParsedQuery {
  const empty: ParsedQuery = {
    tiers: new Set(),
    regions: new Set(),
    countries: new Set(),
    states: new Set(),
    levels: new Set(),
    freeText: "",
    hasStructure: false,
  };

  const norm = raw
    .toLowerCase()
    .replace(/[^\w\s&'-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!norm) return empty;

  const words = norm.split(" ");
  const consumed = new Array<boolean>(words.length).fill(false);

  const tiers = new Set<Tier>();
  const regions = new Set<Region>();
  const countries = new Set<string>();
  const states = new Set<string>();
  const levels = new Set<Level>();

  // Try longest phrases first so "united states" beats "states", and
  // "south korea" beats "korea".
  const MAX_WINDOW = 4;
  for (let size = MAX_WINDOW; size >= 1; size--) {
    for (let i = 0; i + size <= words.length; i++) {
      let alreadyConsumed = false;
      for (let j = i; j < i + size; j++) {
        if (consumed[j]) { alreadyConsumed = true; break; }
      }
      if (alreadyConsumed) continue;

      const phrase = words.slice(i, i + size).join(" ");
      const mark = () => {
        for (let j = i; j < i + size; j++) consumed[j] = true;
      };

      if (countryNameToIso3[phrase]) {
        countries.add(countryNameToIso3[phrase]);
        mark();
        continue;
      }
      if (COUNTRY_ALIASES[phrase]) {
        countries.add(COUNTRY_ALIASES[phrase]);
        mark();
        continue;
      }
      if (STATE_MAP[phrase]) {
        states.add(STATE_MAP[phrase]);
        mark();
        continue;
      }
      if (REGION_MAP[phrase]) {
        regions.add(REGION_MAP[phrase]);
        mark();
        continue;
      }
      // Single-word: tier / level
      if (size === 1) {
        if (TIER_MAP[phrase]) { tiers.add(TIER_MAP[phrase]); mark(); continue; }
        if (LEVEL_MAP[phrase]) { levels.add(LEVEL_MAP[phrase]); mark(); continue; }
      }
    }
  }

  // US state named → entry must be a United States entry. Don't force level,
  // since the drawer already partitions federal vs state and the user may
  // want to see "texas" match cleanly without having to also say "state".
  if (states.size > 0) countries.add("USA");

  const leftover = words.filter((w, i) => !consumed[i] && !FILLER_WORDS.has(w));
  const freeText = leftover.join(" ").trim();

  const hasStructure =
    tiers.size > 0 ||
    regions.size > 0 ||
    countries.size > 0 ||
    states.size > 0 ||
    levels.size > 0;

  return { tiers, regions, countries, states, levels, freeText, hasStructure };
}

// Domain synonym map. When the user types "banking", we also want to match
// entries named "Bank", "Deposit", "Financial Institution" — none of which
// contain the literal string "banking". Keep this list focused on the
// financial-regulatory vocabulary the sales team actually talks about.
// Multilingual roots for the core financial-regulatory topics — our coverage
// is global, so Banco de México / Banque de France / Wertpapier-... should
// match an English query. We use the shortest stem that's still
// disambiguating (e.g. "banc" hits bank/banco/banca/bancaria but not other
// words in regulator names).
const BANK_TERMS = [
  "bank", "deposit", "financial institution",
  "banc",       // banco, banca, bancaria, bancário
  "banque",     // French
  "bancaire",   // French adj.
  "bundesbank", // German (already a substring of some names)
];
const SECURITIES_TERMS = [
  "securities", "investment", "capital market", "brokerage",
  "valores",    // Spanish / Portuguese
  "valeurs",    // French
  "wertpapier", // German
  "bolsa",      // Spanish / Portuguese
];
const INSURANCE_TERMS = [
  "insurance", "insurer",
  "seguros",       // Spanish / Portuguese
  "assurance",     // French
  "versicherung",  // German
];

const TOPIC_SYNONYMS: Record<string, string[]> = {
  bank: BANK_TERMS,
  banks: BANK_TERMS,
  banking: BANK_TERMS,
  depository: ["bank", "deposit", "banc"],
  securities: SECURITIES_TERMS,
  security: SECURITIES_TERMS,
  investment: SECURITIES_TERMS,
  investments: SECURITIES_TERMS,
  broker: ["broker", "brokerage", "investment"],
  insurance: INSURANCE_TERMS,
  insurer: INSURANCE_TERMS,
  insurers: INSURANCE_TERMS,
  privacy: ["privacy", "data protection", "data"],
  data: ["data", "privacy"],
  aml: ["anti-money laundering", "financial crimes", "fintrac", "money laundering"],
  cyber: ["cyber", "cybersecurity", "information security"],
  cybersecurity: ["cyber", "cybersecurity", "information security"],
  consumer: ["consumer"],
  tax: ["tax", "revenue", "treasury"],
  energy: ["energy", "utilities", "utility"],
  environment: ["environment", "environmental"],
  environmental: ["environment", "environmental"],
  health: ["health", "medical"],
  pharma: ["pharmaceutical", "drug", "medicine"],
  telecom: ["telecom", "communications"],
  communications: ["communications", "telecom"],
  payments: ["payment", "payments"],
  pension: ["pension", "retirement"],
  labor: ["labor", "labour", "employment"],
  labour: ["labor", "labour", "employment"],
  trade: ["trade", "commerce"],
  commerce: ["commerce", "trade"],
  markets: ["market", "markets", "capital market"],
  market: ["market", "markets", "capital market"],
};

function expandToken(token: string): string[] {
  const out = new Set<string>();
  out.add(token);
  // Light stemming so "banking" → "bank", "securities" → "securitie" (harmless)
  // and "bodies" → "body" etc.
  const stems = [
    token.replace(/ing$/, ""),
    token.replace(/ies$/, "y"),
    token.replace(/es$/, ""),
    token.replace(/s$/, ""),
  ];
  for (const s of stems) if (s.length >= 3 && s !== token) out.add(s);
  const syns = TOPIC_SYNONYMS[token];
  if (syns) syns.forEach((s) => out.add(s));
  return [...out];
}

// Topic-aware free-text match. Every whitespace-separated token in the query
// must appear (itself, a stem, or a synonym) somewhere in the entry's name
// or jurisdiction. Predictable and fast — no fuzzy scoring surprises.
export function matchesFreeText(entry: CoverageEntry, freeText: string): boolean {
  const tokens = freeText
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2);
  if (tokens.length === 0) return true;
  const haystack = `${entry.name} ${entry.jurisdiction}`.toLowerCase();
  for (const t of tokens) {
    const expansions = expandToken(t);
    const hit = expansions.some((e) => haystack.includes(e));
    if (!hit) return false;
  }
  return true;
}

export function matchesParsed(e: CoverageEntry, q: ParsedQuery): boolean {
  if (q.tiers.size > 0 && !q.tiers.has(e.tier)) return false;
  if (q.regions.size > 0 && !q.regions.has(e.region)) return false;
  if (q.countries.size > 0) {
    if (!e.iso3 || !q.countries.has(e.iso3)) return false;
  }
  if (q.states.size > 0) {
    if (e.country !== "United States") return false;
    if (!q.states.has(e.jurisdiction)) return false;
  }
  if (q.levels.size > 0) {
    if (!e.level || !q.levels.has(e.level)) return false;
  }
  return true;
}

export function buildCountryNameIndex(
  byIso: Record<string, { country: string }>
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [iso3, c] of Object.entries(byIso)) {
    if (c.country) out[c.country.toLowerCase()] = iso3;
  }
  return out;
}
