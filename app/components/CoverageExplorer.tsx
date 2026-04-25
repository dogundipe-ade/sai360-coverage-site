"use client";

import { useMemo, useState } from "react";
import Fuse from "fuse.js";
import clsx from "clsx";
import type { CoverageData, CoverageEntry, Tier, Region } from "@/lib/types";
import { buildCountryNameIndex, matchesFreeText, matchesParsed, parseQuery } from "@/lib/parseQuery";
import { SearchBar } from "./SearchBar";
import { TierTabs } from "./TierTabs";
import { RegionFilter } from "./RegionFilter";
import { WorldMap } from "./WorldMap";
import { Directory } from "./Directory";
import { CountryDrawer } from "./CountryDrawer";
import { Hero } from "./Hero";
import { CoverageRequestCTA } from "./CoverageRequestCTA";

export function CoverageExplorer({ data }: { data: CoverageData }) {
  const [tier, setTier] = useState<Tier | "all">("all");
  const [region, setRegion] = useState<Region | "all">("all");
  const [query, setQuery] = useState("");
  const [selectedIso, setSelectedIso] = useState<string | null>(null);
  const [view, setView] = useState<"map" | "list">("map");

  const allEntries: CoverageEntry[] = useMemo(
    () => [
      ...data.regulators,
      ...data.rulebooks,
      ...data.legislation,
      ...data.exchanges,
    ],
    [data]
  );

  const fuse = useMemo(
    () =>
      new Fuse(allEntries, {
        includeScore: true,
        threshold: 0.32,
        ignoreLocation: true,
        keys: [
          { name: "name", weight: 0.7 },
          { name: "jurisdiction", weight: 0.2 },
          { name: "country", weight: 0.1 },
        ],
      }),
    [allEntries]
  );

  const countryNameIndex = useMemo(
    () => buildCountryNameIndex(data.byIso),
    [data.byIso]
  );

  // Entries matching current region + search (ignoring tier), reused for
  // both the filtered view and the per-tier counts shown in the tabs.
  const regionAndQueryMatches = useMemo(() => {
    const base = region === "all" ? allEntries : allEntries.filter((e) => e.region === region);
    if (!query.trim()) return base;

    const parsed = parseQuery(query, countryNameIndex);
    const structured = parsed.hasStructure
      ? base.filter((e) => matchesParsed(e, parsed))
      : base;

    if (!parsed.freeText) {
      // Either the whole query was structural ("regulators in canada"), or
      // it was only filler words — in both cases skip the fuzzy pass.
      return parsed.hasStructure ? structured : base;
    }
    // Topic-aware substring + synonym match first (predictable for queries
    // like "banking regulators in canada" where "Bank of Canada" is the
    // desired hit).
    const topicMatches = structured.filter((e) => matchesFreeText(e, parsed.freeText));
    if (topicMatches.length > 0) return topicMatches;
    // Fall back to Fuse fuzzy so typos ("regualtors", "SECC") still land.
    const candidateSet = new Set(structured);
    return fuse
      .search(parsed.freeText)
      .map((r) => r.item)
      .filter((e) => candidateSet.has(e));
  }, [allEntries, region, query, fuse, countryNameIndex]);

  const filtered = useMemo(() => {
    if (tier === "all") return regionAndQueryMatches;
    return regionAndQueryMatches.filter((e) => e.tier === tier);
  }, [regionAndQueryMatches, tier]);

  const tierCounts = useMemo(() => ({
    all: regionAndQueryMatches.length,
    regulators: regionAndQueryMatches.filter((e) => e.tier === "regulators").length,
    rulebooks: regionAndQueryMatches.filter((e) => e.tier === "rulebooks").length,
    legislation: regionAndQueryMatches.filter((e) => e.tier === "legislation").length,
    exchanges: regionAndQueryMatches.filter((e) => e.tier === "exchanges").length,
  }), [regionAndQueryMatches]);

  const drawerEntries = useMemo(() => {
    if (!selectedIso) return [];
    return allEntries.filter((e) => e.iso3 === selectedIso);
  }, [selectedIso, allEntries]);

  const drawerCountry = selectedIso
    ? data.byIso[selectedIso]?.country ?? drawerEntries[0]?.country
    : undefined;

  // For map shading: aggregate only the currently-filtered set by ISO.
  const byIsoFiltered = useMemo(() => {
    const out: typeof data.byIso = {};
    for (const e of filtered) {
      if (!e.iso3) continue;
      if (!out[e.iso3]) {
        out[e.iso3] = {
          iso3: e.iso3,
          country: e.country,
          regulators: 0,
          rulebooks: 0,
          legislation: 0,
          exchanges: 0,
          total: 0,
        };
      }
      out[e.iso3][e.tier] += 1;
      out[e.iso3].total += 1;
    }
    return out;
  }, [filtered]);

  return (
    <div className="mx-auto w-full max-w-page px-5 md:px-8 lg:px-12 pb-20">
      <section className="mt-8 md:mt-10">
        <Hero summary={data.summary} />
      </section>

      <section className="mt-7">
        <SearchBar value={query} onChange={setQuery} />
      </section>

      <section className="mt-5 space-y-4">
        <TierTabs value={tier} onChange={setTier} counts={tierCounts} />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <RegionFilter value={region} onChange={setRegion} />
          <div className="flex items-center gap-4">
            <div className="text-sm text-ink-500 tabular-nums">
              {filtered.length.toLocaleString()} {filtered.length === 1 ? "entry" : "entries"} shown
            </div>
            <ViewToggle value={view} onChange={setView} />
          </div>
        </div>
      </section>

      {view === "map" ? (
        <section className="mt-6">
          <WorldMap
            byIso={byIsoFiltered}
            activeTier={tier}
            selectedIso={selectedIso}
            onSelect={setSelectedIso}
          />
        </section>
      ) : (
        <section>
          <Directory
            entries={filtered}
            activeTier={tier}
            query={query}
            onSelectCountry={(iso3) => setSelectedIso(iso3)}
          />
        </section>
      )}

      <CountryDrawer
        iso3={selectedIso}
        countryName={drawerCountry}
        entries={drawerEntries}
        onClose={() => setSelectedIso(null)}
      />

      <CoverageRequestCTA />

      <footer className="mt-16 border-t border-ink-100 pt-6 text-xs text-ink-400">
        Data last built {new Date(data.summary.builtAt).toLocaleDateString()}{" "}
        · {data.summary.regulators + data.summary.rulebooks + data.summary.exchanges}{" "}
        coverage entries across {data.summary.jurisdictions} jurisdictions
      </footer>
    </div>
  );
}

function ViewToggle({
  value,
  onChange,
}: {
  value: "map" | "list";
  onChange: (v: "map" | "list") => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="View mode"
      className="inline-flex items-center rounded-full border border-ink-100 bg-white p-1 shadow-soft"
    >
      <ToggleBtn active={value === "map"} onClick={() => onChange("map")} label="Map">
        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M2.5 5.5L7 4l6 2 4.5-1.5v10L13 16l-6-2-4.5 1.5v-10z" strokeLinejoin="round" />
          <path d="M7 4v10M13 6v10" />
        </svg>
      </ToggleBtn>
      <ToggleBtn active={value === "list"} onClick={() => onChange("list")} label="List">
        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M4 6h12M4 10h12M4 14h12" strokeLinecap="round" />
        </svg>
      </ToggleBtn>
    </div>
  );
}

function ToggleBtn({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-all focus-ring",
        active
          ? "bg-brand-deep text-white shadow-soft"
          : "text-ink-600 hover:text-ink-900"
      )}
    >
      {children}
      {label}
    </button>
  );
}

