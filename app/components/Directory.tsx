"use client";

import clsx from "clsx";
import type { CoverageEntry, Tier } from "@/lib/types";
import { TIER_SHORT } from "@/lib/types";
import { useCart, entryId } from "@/lib/cart";

interface Props {
  entries: CoverageEntry[];
  activeTier: Tier | "all";
  query: string;
  onSelectCountry: (iso3: string) => void;
}

export function Directory({ entries, activeTier, query, onSelectCountry }: Props) {
  const grouped = groupByCountry(entries);
  const countries = Object.values(grouped).sort((a, b) =>
    b.entries.length - a.entries.length || a.country.localeCompare(b.country)
  );

  if (entries.length === 0) {
    return (
      <div className="card mt-6 p-10 text-center">
        <div className="text-lg font-semibold text-ink-800">No matches</div>
        <div className="mt-1 text-sm text-ink-500">
          {query
            ? `No coverage found for "${query}" in the current view.`
            : "Try a different tier or region."}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {countries.map((c) => (
        <div key={c.key} className="card group overflow-hidden">
          <button
            onClick={() => c.iso3 && onSelectCountry(c.iso3)}
            className={clsx(
              "flex w-full items-center justify-between gap-3 p-5 text-left",
              c.iso3 ? "hover:bg-surface-muted" : ""
            )}
          >
            <div>
              <div className="text-[15px] font-semibold tracking-tight text-ink-900">
                {c.country}
              </div>
              <div className="mt-0.5 text-xs text-ink-500">
                {summarize(c.entries, activeTier)}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="chip bg-brand-pale/60 text-brand-deep border-brand-sky/40 tabular-nums">
                {c.entries.length}
              </span>
              {c.iso3 && (
                <svg
                  viewBox="0 0 16 16"
                  className="h-4 w-4 text-ink-400 transition-transform group-hover:translate-x-0.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path d="M6 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
          </button>
          <div className="hair" />
          <ul className="max-h-48 divide-y divide-ink-50 overflow-y-auto">
            {c.entries.slice(0, 8).map((e, i) => (
              <li
                key={`${e.tier}-${e.name}-${i}`}
                className="flex items-start gap-3 px-5 py-2.5 text-[13.5px]"
              >
                <TierDot tier={e.tier} />
                <span className="min-w-0 flex-1 text-ink-800">
                  <span className="flex items-center">
                    <span className="truncate">{e.name}</span>
                    <LevelChip level={e.level} />
                  </span>
                  {e.jurisdiction && e.jurisdiction !== c.country && (
                    <span className="mt-0.5 block truncate text-[11.5px] text-ink-400">
                      {e.jurisdiction}
                    </span>
                  )}
                </span>
                {e.tier === "regulators" && <SelectButton entry={e} />}
              </li>
            ))}
            {c.entries.length > 8 && (
              <li className="px-5 py-2 text-xs text-ink-500">
                + {c.entries.length - 8} more — click country to see all
              </li>
            )}
          </ul>
        </div>
      ))}
    </div>
  );
}

function summarize(entries: CoverageEntry[], activeTier: Tier | "all") {
  if (activeTier !== "all") return `${entries.length} ${TIER_SHORT[activeTier].toLowerCase()}`;
  const tiers = countBy(entries, (e) => e.tier);
  const parts: string[] = [];
  if (tiers.regulators) parts.push(`${tiers.regulators} regulators`);
  if (tiers.rulebooks) parts.push(`${tiers.rulebooks} rulebooks`);
  if (tiers.legislation) parts.push(`${tiers.legislation} legislatures`);
  if (tiers.exchanges) parts.push(`${tiers.exchanges} exchanges`);
  return parts.join(" · ");
}

function countBy<T>(arr: T[], key: (t: T) => string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const item of arr) out[key(item)] = (out[key(item)] ?? 0) + 1;
  return out;
}

interface Group {
  key: string;
  country: string;
  iso3: string | null;
  entries: CoverageEntry[];
}

function groupByCountry(entries: CoverageEntry[]): Record<string, Group> {
  const out: Record<string, Group> = {};
  for (const e of entries) {
    const key = e.iso3 ?? `__${e.country}`;
    if (!out[key]) {
      out[key] = {
        key,
        country: e.country || e.jurisdiction || "Unspecified",
        iso3: e.iso3,
        entries: [],
      };
    }
    out[key].entries.push(e);
  }
  return out;
}

function TierDot({ tier }: { tier: Tier }) {
  const color =
    tier === "regulators"
      ? "bg-brand-teal"
      : tier === "rulebooks"
      ? "bg-brand-mint"
      : tier === "legislation"
      ? "bg-amber-500"
      : "bg-brand-deep";
  const title =
    tier === "regulators"
      ? "Regulator"
      : tier === "rulebooks"
      ? "Consolidated rulebook"
      : tier === "legislation"
      ? "Legislature"
      : "Exchange";
  return (
    <span
      title={title}
      className={clsx("mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full", color)}
    />
  );
}

/**
 * Small "+ / ✓" toggle next to a regulator row. Clicking doesn't bubble up to
 * the parent country-card button (which would otherwise open the drawer).
 */
export function SelectButton({ entry }: { entry: CoverageEntry }) {
  const cart = useCart();
  const id = entryId(entry);
  const selected = cart.has(id);
  return (
    <button
      type="button"
      onClick={(ev) => {
        ev.stopPropagation();
        cart.toggle(entry);
      }}
      aria-pressed={selected}
      aria-label={selected ? `Remove ${entry.name}` : `Add ${entry.name}`}
      className={clsx(
        "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-all focus-ring",
        selected
          ? "bg-brand-teal text-white shadow-soft"
          : "border border-ink-200 text-ink-500 hover:border-brand-teal hover:text-brand-teal"
      )}
      title={selected ? "Remove from selections" : "Add to selections"}
    >
      {selected ? (
        <svg viewBox="0 0 14 14" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.4">
          <path d="M3 7.5l3 3 5-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg viewBox="0 0 14 14" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M7 3v8M3 7h8" strokeLinecap="round" />
        </svg>
      )}
    </button>
  );
}

function LevelChip({ level }: { level?: CoverageEntry["level"] }) {
  if (!level) return null;
  const isFed = level === "federal";
  return (
    <span
      className={clsx(
        "ml-2 inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1 shrink-0",
        isFed
          ? "bg-brand-deep/10 text-brand-deep ring-brand-deep/20"
          : "bg-amber-100 text-amber-800 ring-amber-300/40"
      )}
      title={isFed ? "US federal" : "US state"}
    >
      {isFed ? "Fed" : "State"}
    </span>
  );
}
