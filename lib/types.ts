export type Tier = "regulators" | "rulebooks" | "legislation" | "exchanges";
export type Region = "Americas" | "EMEA" | "APAC" | "Global";
export type Level = "federal" | "state";

export const TIER_ORDER: Tier[] = ["regulators", "rulebooks", "legislation", "exchanges"];

export interface CoverageEntry {
  tier: Tier;
  name: string;
  jurisdiction: string;
  country: string;
  iso3: string | null;
  region: Region;
  level?: Level | null;
  size?: string | null;
  stockExchange?: boolean;
  permissionsCategory?: string | null;
}

export interface CountryAggregate {
  iso3: string;
  country: string;
  regulators: number;
  rulebooks: number;
  legislation: number;
  exchanges: number;
  total: number;
}

export type PricingFamily =
  | "Regulatory Content"
  | "Legislative Content"
  | "Consolidated Rulebooks"
  | "Exchanges";
export type PricingUnit = "regulators" | "jurisdictions" | "bundle";
export type BundleKey = "rulebooks" | "exchanges";

export interface PricingSku {
  family: PricingFamily;
  /** Which quantity drives this family: regulators / jurisdictions / bundle (flat). */
  unit: PricingUnit;
  /** Short tier label e.g. "up to 30 Regulators". */
  tier: string;
  /** Full original label from the spreadsheet. */
  label: string;
  sku: string;
  delivery: string | null;
  /** Annual price in USD. `null` when `isCustom` is true. */
  price: number | null;
  isCustom: boolean;
  /** Upper bound for "up to N" tiers. `null` for the >N / custom tier. */
  threshold: number | null;
  /** Lower bound for the ">N" tier. `null` otherwise. */
  overFloor: number | null;
  notes: string | null;
  /** True for flat-price bundle add-ons (rulebooks, exchanges). */
  isBundle?: boolean;
  /** Identifier used by the cart to toggle a bundle on/off. */
  bundleKey?: BundleKey;
}

export interface CoverageData {
  summary: {
    regulators: number;
    rulebooks: number;
    legislation: number;
    exchanges: number;
    jurisdictions: number;
    builtAt: string;
  };
  regulators: CoverageEntry[];
  rulebooks: CoverageEntry[];
  legislation: CoverageEntry[];
  exchanges: CoverageEntry[];
  byIso: Record<string, CountryAggregate>;
  unmapped: string[];
  pricing: PricingSku[];
}

export const TIER_LABELS: Record<Tier, string> = {
  regulators: "Regulators",
  rulebooks: "Consolidated rulebooks",
  legislation: "Legislation",
  exchanges: "Exchanges",
};

export const TIER_SHORT: Record<Tier, string> = {
  regulators: "Regulators",
  rulebooks: "Rulebooks",
  legislation: "Legislation",
  exchanges: "Exchanges",
};

export const TIER_DESCRIPTIONS: Record<Tier, string> = {
  regulators:
    "Regulatory bodies we track for notices, enforcement actions, and rule changes.",
  rulebooks:
    "Publishers whose full rulebook text we ingest and consolidate.",
  legislation:
    "Federal and state legislatures whose bills and statutes we cover.",
  exchanges:
    "Stock, clearing, and derivatives exchanges in our coverage universe.",
};
