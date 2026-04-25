"use client";

import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import type { CoverageEntry, Tier } from "@/lib/types";
import { TIER_LABELS, TIER_ORDER } from "@/lib/types";
import { useCart } from "@/lib/cart";
import { SelectButton } from "./Directory";

interface Props {
  iso3: string | null;
  countryName?: string;
  entries: CoverageEntry[];
  onClose: () => void;
}

type LevelFilter = "all" | "federal" | "state";

export function CountryDrawer({ iso3, countryName, entries, onClose }: Props) {
  const open = !!iso3;
  const isUS = iso3 === "USA";
  const [levelFilter, setLevelFilter] = useState<LevelFilter>("all");
  const cart = useCart();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Reset the level filter whenever a new country is opened.
  useEffect(() => {
    setLevelFilter("all");
  }, [iso3]);

  const visible = useMemo(() => {
    if (!isUS || levelFilter === "all") return entries;
    return entries.filter((e) => e.level === levelFilter);
  }, [entries, isUS, levelFilter]);

  const grouped = useMemo(() => groupByTier(visible), [visible]);

  const totalTiers = (Object.keys(grouped) as Tier[]).filter(
    (t) => grouped[t].length > 0
  );

  return (
    <>
      {/* backdrop */}
      <div
        onClick={onClose}
        className={clsx(
          "fixed inset-0 z-40 bg-ink-900/30 backdrop-blur-[2px] transition-opacity",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      />
      {/* drawer */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`Coverage for ${countryName ?? "country"}`}
        className={clsx(
          "fixed right-0 top-0 z-50 h-full w-full max-w-xl transform border-l border-ink-100 bg-white shadow-drawer transition-transform duration-200 ease-out",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        {open && (
          <div className="flex h-full flex-col">
            <header className="border-b border-ink-100 px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-medium uppercase tracking-wider text-ink-400">
                    Coverage detail
                  </div>
                  <h2 className="mt-1 text-2xl font-semibold tracking-tight text-ink-900">
                    {countryName}
                  </h2>
                  <div className="mt-1 text-sm text-ink-500">
                    {visible.length} {visible.length === 1 ? "entry" : "entries"} across{" "}
                    {totalTiers.map((t) => TIER_LABELS[t].toLowerCase()).join(" · ")}
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="focus-ring rounded-lg p-2 text-ink-400 hover:bg-ink-50 hover:text-ink-700"
                  aria-label="Close"
                >
                  <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
                  </svg>
                </button>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                {isUS ? (
                  <LevelSegmented value={levelFilter} onChange={setLevelFilter} />
                ) : (
                  <span />
                )}
                <BulkAddRegulators entries={visible} country={countryName ?? ""} />
              </div>
            </header>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
              {TIER_ORDER.map((tier) => {
                const items = grouped[tier];
                if (!items || !items.length) return null;
                return (
                  <section key={tier}>
                    <div className="mb-2 flex items-center gap-2">
                      <TierBadge tier={tier} />
                      <h3 className="text-sm font-semibold text-ink-800">
                        {TIER_LABELS[tier]}
                      </h3>
                      <span className="chip tabular-nums">{items.length}</span>
                    </div>
                    {isUS && levelFilter === "state" ? (
                      <StateGroupedList items={items} country={countryName ?? ""} />
                    ) : (
                      <FlatList items={items} country={countryName ?? ""} />
                    )}
                  </section>
                );
              })}

              {visible.length === 0 && (
                <div className="rounded-xl2 border border-dashed border-ink-200 bg-surface-muted/40 p-6 text-center text-sm text-ink-500">
                  No entries match the current filter.
                </div>
              )}
            </div>
          </div>
        )}
      </aside>
    </>
  );
}

function FlatList({
  items,
  country,
}: {
  items: CoverageEntry[];
  country: string;
}) {
  return (
    <ul className="divide-y divide-ink-50 rounded-xl2 border border-ink-100 bg-surface-muted/40">
      {items.map((e, i) => (
        <li key={`${e.name}-${i}`} className="px-4 py-3">
          <EntryRow e={e} country={country} />
        </li>
      ))}
    </ul>
  );
}

function StateGroupedList({
  items,
  country,
}: {
  items: CoverageEntry[];
  country: string;
}) {
  const groups = useMemo(() => {
    const out: Record<string, CoverageEntry[]> = {};
    for (const e of items) {
      const key = e.jurisdiction || "Unspecified";
      if (!out[key]) out[key] = [];
      out[key].push(e);
    }
    return Object.entries(out).sort(([a], [b]) => a.localeCompare(b));
  }, [items]);

  if (groups.length === 0) {
    return (
      <div className="rounded-xl2 border border-dashed border-ink-200 bg-surface-muted/40 p-4 text-sm text-ink-500">
        No state-level entries in this tier yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {groups.map(([state, arr]) => (
        <div key={state} className="rounded-xl2 border border-ink-100 bg-white">
          <div className="flex items-center justify-between px-4 py-2 border-b border-ink-50">
            <div className="text-sm font-semibold text-ink-800">{state}</div>
            <span className="chip tabular-nums">{arr.length}</span>
          </div>
          <ul className="divide-y divide-ink-50">
            {arr.map((e, i) => (
              <li key={`${e.name}-${i}`} className="px-4 py-2.5">
                <EntryRow e={e} country={country} hideJurisdiction />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function EntryRow({
  e,
  country,
  hideJurisdiction,
}: {
  e: CoverageEntry;
  country: string;
  hideJurisdiction?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center">
          <span className="text-[14.5px] font-medium text-ink-900 flex-1 min-w-0">
            {e.name}
          </span>
          {e.level && <LevelPill level={e.level} />}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-ink-500">
          {!hideJurisdiction && e.jurisdiction && e.jurisdiction !== country && (
            <span>{e.jurisdiction}</span>
          )}
          {e.size && <span className="chip">Size {e.size}</span>}
          {e.stockExchange && <span className="chip">Stock exchange</span>}
          {e.permissionsCategory && (
            <span className="chip" title={e.permissionsCategory}>
              Permissions {e.permissionsCategory.split(" ")[0]}
            </span>
          )}
        </div>
      </div>
      {e.tier === "regulators" && <SelectButton entry={e} />}
    </div>
  );
}

function BulkAddRegulators({
  entries,
  country,
}: {
  entries: CoverageEntry[];
  country: string;
}) {
  const cart = useCart();
  const regulators = useMemo(
    () => entries.filter((e) => e.tier === "regulators"),
    [entries]
  );
  if (regulators.length === 0) return <span />;
  const allSelected = regulators.every((e) =>
    cart.has(`${e.tier}|${e.iso3 ?? e.country}|${e.name}`)
  );
  return (
    <button
      type="button"
      onClick={() => cart.addMany(regulators)}
      disabled={allSelected}
      className={clsx(
        "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition-all focus-ring",
        allSelected
          ? "bg-brand-pale text-brand-deep"
          : "bg-brand-deep text-white shadow-soft hover:bg-brand-teal"
      )}
      title={`Add every regulator from ${country} to your selections`}
    >
      {allSelected ? (
        <>
          <svg viewBox="0 0 14 14" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.4">
            <path d="M3 7.5l3 3 5-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          All {regulators.length} regulators selected
        </>
      ) : (
        <>
          <svg viewBox="0 0 14 14" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M7 3v8M3 7h8" strokeLinecap="round" />
          </svg>
          Add all {regulators.length} regulators
        </>
      )}
    </button>
  );
}

function LevelSegmented({
  value,
  onChange,
}: {
  value: LevelFilter;
  onChange: (v: LevelFilter) => void;
}) {
  const OPTS: { key: LevelFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "federal", label: "Federal" },
    { key: "state", label: "By state" },
  ];
  return (
    <div
      role="tablist"
      aria-label="Jurisdiction level"
      className="inline-flex items-center rounded-full border border-ink-100 bg-surface-muted p-1"
    >
      {OPTS.map((opt) => {
        const active = value === opt.key;
        return (
          <button
            key={opt.key}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.key)}
            className={clsx(
              "rounded-full px-3 py-1.5 text-sm font-medium transition-all focus-ring",
              active
                ? "bg-white text-brand-deep shadow-soft"
                : "text-ink-600 hover:text-ink-900"
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function LevelPill({ level }: { level: NonNullable<CoverageEntry["level"]> }) {
  const isFed = level === "federal";
  return (
    <span
      className={clsx(
        "ml-2 inline-flex shrink-0 items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1",
        isFed
          ? "bg-brand-deep/10 text-brand-deep ring-brand-deep/20"
          : "bg-amber-100 text-amber-800 ring-amber-300/40"
      )}
    >
      {isFed ? "Fed" : "State"}
    </span>
  );
}

function groupByTier(entries: CoverageEntry[]) {
  const out: Record<Tier, CoverageEntry[]> = {
    regulators: [],
    rulebooks: [],
    legislation: [],
    exchanges: [],
  };
  for (const e of entries) out[e.tier].push(e);
  for (const tier of Object.keys(out) as Tier[]) {
    out[tier].sort((a, b) => a.name.localeCompare(b.name));
  }
  return out;
}

function TierBadge({ tier }: { tier: Tier }) {
  const tone =
    tier === "regulators"
      ? "bg-brand-teal/10 text-brand-teal ring-brand-teal/20"
      : tier === "rulebooks"
      ? "bg-brand-mint/20 text-emerald-800 ring-brand-mint/40"
      : tier === "legislation"
      ? "bg-amber-100 text-amber-800 ring-amber-300/40"
      : "bg-brand-deep/10 text-brand-deep ring-brand-deep/20";
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider ring-1",
        tone
      )}
    >
      {tier}
    </span>
  );
}
