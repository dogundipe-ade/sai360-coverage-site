"use client";

import { useMemo } from "react";
import clsx from "clsx";
import type { CoverageEntry } from "@/lib/types";
import { useCart } from "@/lib/cart";

// "Your company probably looks like this" scenarios for live demos. Each
// persona declares a filter over the regulator dataset plus suggested
// settings for bundles and the legislative-jurisdictions slider.
//
// The filters use simple keyword matching so they survive small name
// changes in the spreadsheet. Feel free to tune the keywords or caps if
// any persona picks up too little / too much.

interface Persona {
  id: string;
  title: string;
  subtitle: string;
  blurb: string;
  /** Annual legislative jurisdictions — seeds that slider. */
  legCount: number;
  /** Whether the rulebooks bundle should switch on by default. */
  rulebooks: boolean;
  /** Whether the exchanges bundle should switch on. */
  exchanges: boolean;
  /** Hard cap on regulators to include — avoids edge-case over-selection. */
  cap: number;
  filter: (r: CoverageEntry) => boolean;
}

const BANK = [
  "bank",
  "deposit",
  "financial institution",
  "currency",
  "prudential",
  "banc",
  "banque",
  "bancaria",
  // Additional terms so US heavyweights land in the regional-bank preset
  // even though their names don't literally contain "bank":
  "federal reserve", // Board of Governors of the Federal Reserve System
  "financial protection", // Consumer Financial Protection Bureau
  "credit union", // National Credit Union Administration
];
const SECURITIES = [
  "securities",
  "investment",
  "capital market",
  "exchange commission",
  "markets authority",
  "conduct authority",
  "valores",
  "bolsa",
  "wertpapier",
];
const INSURANCE = [
  "insurance",
  "insurer",
  "assurance",
  "seguros",
  "versicher",
];

const US_BANK_ACRONYMS = /\b(OCC|CFPB|FDIC|FRB|FED|FINCEN|NCUA|FSOC)\b/i;

function hasAny(name: string, words: string[]) {
  const lo = name.toLowerCase();
  return words.some((w) => lo.includes(w));
}

const GLOBAL_FIN_HUBS = new Set([
  "USA", "GBR", "DEU", "FRA", "NLD", "LUX", "IRL", "CHE",
  "JPN", "HKG", "SGP", "AUS", "CAN",
]);

const EMEA_INSURER_COUNTRIES = new Set([
  "GBR", "DEU", "FRA", "NLD", "ITA", "ESP", "CHE", "SWE", "IRL",
  "BEL", "DNK", "NOR", "FIN", "AUT", "LUX", "POL",
]);

const PERSONAS: Persona[] = [
  {
    id: "us-bank",
    title: "Regional US bank",
    subtitle: "~15 regulators · 5 jurisdictions",
    blurb:
      "US-only banking footprint — federal prudential regulators plus select state banking departments.",
    legCount: 5,
    rulebooks: true,
    exchanges: false,
    cap: 15,
    filter: (r) =>
      r.country === "United States" &&
      (hasAny(r.name, BANK) || US_BANK_ACRONYMS.test(r.name)),
  },
  {
    id: "global-asset-mgr",
    title: "Global asset manager",
    subtitle: "~75 regulators · 40 jurisdictions",
    blurb:
      "Securities and markets regulators across major financial centers — US, UK, EU, APAC hubs.",
    legCount: 40,
    rulebooks: true,
    exchanges: true,
    cap: 75,
    filter: (r) =>
      GLOBAL_FIN_HUBS.has(r.iso3 ?? "") &&
      (hasAny(r.name, SECURITIES) || hasAny(r.name, BANK)),
  },
  {
    id: "emea-insurer",
    title: "EMEA insurer",
    subtitle: "~25 regulators · 15 jurisdictions",
    blurb:
      "European insurance supervisors plus core prudential regulators across the region.",
    legCount: 15,
    rulebooks: true,
    exchanges: false,
    cap: 25,
    filter: (r) =>
      EMEA_INSURER_COUNTRIES.has(r.iso3 ?? "") &&
      (hasAny(r.name, INSURANCE) || hasAny(r.name, BANK)),
  },
];

export function PersonaPresets({
  regulators,
  onApply,
}: {
  regulators: CoverageEntry[];
  /** Called with the persona's suggested legislative-jurisdictions count. */
  onApply: (legCount: number) => void;
}) {
  const cart = useCart();

  // Pre-compute which regulators each persona would pick so we can show a
  // live "X regulators" count on each card. Sorting prioritizes federal
  // regulators first, then alphabetical.
  const previews = useMemo(() => {
    return PERSONAS.map((p) => {
      const matched = regulators
        .filter((r) => r.tier === "regulators" && p.filter(r))
        .sort((a, b) => {
          const aFed = a.level === "federal" ? 0 : 1;
          const bFed = b.level === "federal" ? 0 : 1;
          if (aFed !== bFed) return aFed - bFed;
          return a.name.localeCompare(b.name);
        })
        .slice(0, p.cap);
      return { persona: p, matched };
    });
  }, [regulators]);

  const handleApply = (
    persona: Persona,
    matched: CoverageEntry[]
  ) => {
    cart.clear();
    cart.addMany(matched);
    cart.setBundle("rulebooks", persona.rulebooks);
    cart.setBundle("exchanges", persona.exchanges);
    onApply(persona.legCount);
  };

  return (
    <div className="card p-6">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-brand-deep">
            Quick start
          </div>
          <h2 className="mt-1 text-lg font-semibold tracking-tight text-ink-900">
            Your company probably looks like this
          </h2>
          <p className="mt-1 text-sm text-ink-500">
            One click builds a representative cart. You can fine-tune from
            there — add more regulators, swap the bundle toggles, or hit{" "}
            <span className="font-semibold">Reset</span> in the top nav to
            start clean.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {previews.map(({ persona, matched }) => (
          <button
            key={persona.id}
            type="button"
            onClick={() => handleApply(persona, matched)}
            className={clsx(
              "group rounded-xl2 border border-ink-100 bg-white p-4 text-left transition-all focus-ring",
              "hover:border-brand-teal hover:shadow-lift"
            )}
          >
            <div className="text-sm font-semibold text-ink-900">
              {persona.title}
            </div>
            <div className="mt-0.5 text-[11px] font-medium uppercase tracking-wider text-brand-teal">
              {matched.length} regulators · {persona.legCount} jurisdictions
            </div>
            <p className="mt-2 text-xs leading-relaxed text-ink-500">
              {persona.blurb}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {persona.rulebooks && (
                <span className="chip bg-brand-pale/60 text-brand-deep border-brand-sky/40">
                  + Rulebooks
                </span>
              )}
              {persona.exchanges && (
                <span className="chip bg-brand-pale/60 text-brand-deep border-brand-sky/40">
                  + Exchanges
                </span>
              )}
            </div>
            <div className="mt-3 inline-flex items-center gap-1 text-[12px] font-semibold text-brand-deep transition-colors group-hover:text-brand-teal">
              Apply preset
              <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
