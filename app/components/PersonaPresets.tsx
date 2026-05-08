"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

// ===== Keyword bags shared across personas =====

const BANK = [
  "bank",
  "deposit",
  "financial institution",
  "currency",
  "prudential",
  "banc",
  "banque",
  "bancaria",
  // Additional terms so US heavyweights land in bank-flavored presets
  // even though their names don't literally contain "bank":
  "federal reserve", // Board of Governors of the Federal Reserve System
  "financial protection", // Consumer Financial Protection Bureau
  "credit union", // National Credit Union Administration
  "comptroller", // Office of the Comptroller of the Currency
  "examination council", // FFIEC
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
const PRIVACY = [
  "data protection",
  "privacy",
  "personal data",
  "information commissioner",
];
const COMMODITIES_FUTURES = [
  "commodity",
  "commodities",
  "futures",
  "derivatives",
];
const HEALTHCARE = [
  "health",
  "medic",
  "human services",
  "food and drug",
  "drug administration",
];

const US_BANK_ACRONYMS = /\b(OCC|CFPB|FDIC|FRB|FED|FINCEN|NCUA|FSOC|FFIEC|OFAC)\b/i;
const US_FED_FIN_HEAVYWEIGHT = /\b(SEC|CFTC|FINRA|FinCEN|OFAC|OCC|FDIC|CFPB|NCUA|FFIEC|FSOC|FRB|FTC|NIST|MSRB)\b/i;

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

// Major financial centers whose securities/conduct regulators a crypto or
// digital-asset platform almost always has to deal with.
const CRYPTO_HUB_COUNTRIES = new Set([
  "USA", "GBR", "SGP", "HKG", "ARE", "DEU", "FRA", "CHE",
  "JPN", "AUS", "CAN",
]);

// ===== Personas =====

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
    id: "large-us-bank",
    title: "Large US bank",
    subtitle: "~35 regulators · 12 jurisdictions",
    blurb:
      "Nationally-chartered US bank with 50-state footprint — full federal prudential stack plus the long tail of state banking and consumer finance departments.",
    legCount: 12,
    rulebooks: true,
    exchanges: false,
    cap: 35,
    filter: (r) =>
      r.country === "United States" &&
      (hasAny(r.name, BANK) ||
        US_BANK_ACRONYMS.test(r.name) ||
        /treasury|financial services/i.test(r.name)),
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
    filter: (r) => {
      if (/handbook/i.test(r.name)) return false;
      return (
        GLOBAL_FIN_HUBS.has(r.iso3 ?? "") &&
        (hasAny(r.name, SECURITIES) || hasAny(r.name, BANK))
      );
    },
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
  {
    id: "us-healthcare",
    title: "National healthcare org",
    subtitle: "~14 regulators · 5 jurisdictions",
    blurb:
      "US health system or insurer — HHS plus the state-by-state insurance commissioners that govern most healthcare coverage. (Note: SAI360 doesn't currently cover FDA, CMS, or OCR — flag with product if you need them.)",
    legCount: 5,
    rulebooks: true,
    exchanges: false,
    cap: 15,
    filter: (r) => {
      if (r.country !== "United States") return false;
      // Exclude entries that contain "insurance" but are actually about
      // banking, credit unions, or securities — those don't belong in a
      // healthcare-org coverage profile.
      if (
        /deposit insurance|farm credit|division of credit unions|securities (department|division|commissioner)/i.test(
          r.name
        )
      ) {
        return false;
      }
      // Health-specific: HHS, FDA, etc. (FTC also belongs here for the
      // health-data-privacy / advertising side.)
      if (
        /health|medic|human services|food and drug|drug administration|trade commission/i.test(
          r.name
        )
      )
        return true;
      // State insurance commissioners.
      return hasAny(r.name, INSURANCE);
    },
  },
  {
    id: "fintech-scaleup",
    title: "FinTech scale-up",
    subtitle: "~15 regulators · 8 jurisdictions",
    blurb:
      "US-headquartered fintech expanding into bank-like products — CFPB and FinCEN front and center, plus the state DFS regulators that gate money transmission.",
    legCount: 8,
    rulebooks: true,
    exchanges: false,
    cap: 15,
    filter: (r) =>
      r.country === "United States" &&
      (US_FED_FIN_HEAVYWEIGHT.test(r.name) ||
        /financial protection|financial services|financial institutions|trade commission|crimes enforcement|comptroller|consumer/i.test(
          r.name
        )),
  },
  {
    id: "ai-startup",
    title: "AI startup",
    subtitle: "~12 regulators · 5 jurisdictions",
    blurb:
      "US-headquartered AI company with global users — FTC on consumer protection, NIST on standards, state privacy regulators, plus the data-protection authorities that govern model training and inference.",
    legCount: 5,
    rulebooks: false,
    exchanges: false,
    cap: 12,
    filter: (r) => {
      // US: FTC, NIST, and state privacy regulators (excluding state AG
      // securities divisions which match "privacy" but aren't relevant).
      if (r.country === "United States") {
        return /trade commission|standards.*technology|privacy protection|data privacy/i.test(
          r.name
        );
      }
      // Pan-EU privacy authorities.
      if (r.iso3 === "XEU" && hasAny(r.name, PRIVACY)) return true;
      // CNIL and other named DPAs that don't match the keyword bag cleanly.
      if (/^commission nationale de l.informatique/i.test(r.name)) return true;
      // Major privacy authorities in EU member states + UK + key APAC.
      const PRIVACY_COUNTRIES = [
        "GBR", "IRL", "DEU", "NLD", "CAN", "AUS", "SGP", "CHE",
        "BEL", "ITA", "ESP", "SWE", "DNK", "AUT", "POL", "JPN", "LUX",
      ];
      return (
        hasAny(r.name, PRIVACY) &&
        PRIVACY_COUNTRIES.includes(r.iso3 ?? "")
      );
    },
  },
  {
    id: "crypto-platform",
    title: "Crypto / digital asset platform",
    subtitle: "~17 regulators · 12 jurisdictions",
    blurb:
      "Securities, commodities, and AML regulators across the financial centers crypto platforms can't avoid — US, UK, EU, Singapore, Hong Kong, UAE.",
    legCount: 12,
    rulebooks: true,
    exchanges: true,
    cap: 20,
    filter: (r) => {
      // Exclude the duplicate "Handbook" entries that show up in the
      // regulators tier alongside the real regulator.
      if (/handbook/i.test(r.name)) return false;
      // US: the federal financial stack matched by full name (regulator
      // names in the dataset spell out the agency, not the acronym).
      const isUSCryptoStack =
        r.country === "United States" &&
        /securities and exchange commission|commodity futures trading|financial crimes enforcement|financial industry regulatory|comptroller of the currency|consumer financial protection|office of foreign assets|^us treasury$|^new york state department of financial services$|california department of financial protection/i.test(
          r.name
        );
      // Major non-US hubs — match by explicit regulator name to avoid
      // pulling in every securities body in the country.
      const isHubFinancial =
        /^financial conduct authority$|monetary authority of singapore|hong kong monetary authority|hong kong securities and futures|virtual asset regulatory|^securities and commodities authority$|federal financial supervisory|swiss financial market|^autorité des marchés financiers$|european securities and markets/i.test(
          r.name
        );
      return isUSCryptoStack || isHubFinancial;
    },
  },
  {
    id: "energy-trader",
    title: "Energy / commodities trader",
    subtitle: "~10 regulators · 5 jurisdictions",
    blurb:
      "Commodities and futures regulators across the major derivatives venues. Pair with the Exchanges bundle for CME / ICE / NYMEX rule coverage. (Note: SAI360 doesn't currently track FERC or EPA — flag with product if you need them.)",
    legCount: 5,
    rulebooks: true,
    exchanges: true,
    cap: 12,
    filter: (r) => {
      if (/handbook/i.test(r.name)) return false;
      // US: CFTC and FinCEN are the two federal must-haves; NYDFS and a
      // handful of state financial-services regulators round it out.
      const isUSCommodities =
        r.country === "United States" &&
        (/commodity futures|financial crimes enforcement|^national futures association$/i.test(
          r.name
        ) ||
          /^new york state department of financial services$|^california department of financial protection/i.test(
            r.name
          ));
      // Non-US: the markets/conduct authorities in major commodity-trading
      // hubs, by explicit name.
      const isGlobalCommodities =
        /^financial conduct authority$|monetary authority of singapore|hong kong securities and futures|european securities and markets|swiss financial market|^autorité des marchés financiers$/i.test(
          r.name
        );
      return isUSCommodities || isGlobalCommodities;
    },
  },
];

// ===== Component =====

export function PersonaPresets({
  regulators,
  onApply,
}: {
  regulators: CoverageEntry[];
  /** Called with the persona's suggested legislative-jurisdictions count. */
  onApply: (legCount: number) => void;
}) {
  const cart = useCart();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

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

  const updateScrollState = () => {
    const el = scrollRef.current;
    if (!el) return;
    const slack = 4; // ignore sub-pixel rounding noise
    setCanScrollLeft(el.scrollLeft > slack);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - slack);
  };

  useEffect(() => {
    updateScrollState();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, []);

  const scrollByCard = (direction: -1 | 1) => {
    const el = scrollRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-persona-card]");
    const step = (card?.offsetWidth ?? 300) + 12; // card width + gap
    el.scrollBy({ left: direction * step, behavior: "smooth" });
  };

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
        <div className="hidden shrink-0 items-center gap-1.5 sm:flex">
          <CarouselButton
            direction="left"
            disabled={!canScrollLeft}
            onClick={() => scrollByCard(-1)}
          />
          <CarouselButton
            direction="right"
            disabled={!canScrollRight}
            onClick={() => scrollByCard(1)}
          />
        </div>
      </div>

      <div className="relative mt-5">
        {/* Edge fades hint at more content. Pointer-events-none so they
            don't swallow clicks on the cards underneath. */}
        <div
          aria-hidden
          className={clsx(
            "pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-white to-transparent transition-opacity",
            canScrollLeft ? "opacity-100" : "opacity-0"
          )}
        />
        <div
          aria-hidden
          className={clsx(
            "pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-white to-transparent transition-opacity",
            canScrollRight ? "opacity-100" : "opacity-0"
          )}
        />

        <div
          ref={scrollRef}
          className="snap-x snap-mandatory overflow-x-auto scroll-smooth pb-3 -mx-1 px-1"
          style={{
            // Use inline styles for the layout fundamentals so this works
            // even if a Tailwind utility ever fails to make it into the
            // build. Belt-and-suspenders for the live demo.
            display: "flex",
            flexDirection: "row",
            flexWrap: "nowrap",
            gap: "12px",
            scrollbarWidth: "thin",
            // `minWidth: 0` is the defensive twin of the parent grid's
            // `minmax(0,1fr)` — without it, a flex container can refuse to
            // shrink below its content size and overflow the parent.
            minWidth: 0,
            width: "100%",
          }}
        >
          {previews.map(({ persona, matched }) => (
            <button
              key={persona.id}
              type="button"
              data-persona-card
              onClick={() => handleApply(persona, matched)}
              style={{
                // Hard-pin the card width so flex can't squish them into
                // a 9-up grid on wide screens.
                flex: "0 0 300px",
                width: "300px",
                minWidth: "300px",
              }}
              className={clsx(
                "group snap-start flex flex-col rounded-xl2 border border-ink-100 bg-white p-4 text-left transition-all focus-ring",
                "hover:border-brand-teal hover:shadow-lift"
              )}
            >
              <div className="text-sm font-semibold text-ink-900">
                {persona.title}
              </div>
              <div className="mt-0.5 text-[11px] font-medium uppercase tracking-wider text-brand-teal">
                {matched.length} regulators · {persona.legCount} jurisdictions
              </div>
              <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-ink-500">
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
              <div className="mt-auto pt-3 inline-flex items-center gap-1 text-[12px] font-semibold text-brand-deep transition-colors group-hover:text-brand-teal">
                Apply preset
                <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Mobile-only scroll hint — desktop has the arrow buttons up top. */}
      <div className="mt-1 text-center text-[11px] text-ink-400 sm:hidden">
        Swipe to see more →
      </div>
    </div>
  );
}

function CarouselButton({
  direction,
  disabled,
  onClick,
}: {
  direction: "left" | "right";
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={direction === "left" ? "Previous personas" : "Next personas"}
      className={clsx(
        "inline-flex h-8 w-8 items-center justify-center rounded-full border border-ink-100 bg-white text-ink-600 transition-all focus-ring",
        disabled
          ? "cursor-not-allowed opacity-30"
          : "hover:border-brand-teal hover:text-brand-teal hover:shadow-soft"
      )}
    >
      <svg
        viewBox="0 0 16 16"
        className={clsx("h-3.5 w-3.5", direction === "left" && "rotate-180")}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M6 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
