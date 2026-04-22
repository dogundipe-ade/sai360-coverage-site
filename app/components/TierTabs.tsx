"use client";

import clsx from "clsx";
import type { Tier } from "@/lib/types";

interface Props {
  value: Tier | "all";
  onChange: (t: Tier | "all") => void;
  counts: {
    all: number;
    regulators: number;
    rulebooks: number;
    legislation: number;
    exchanges: number;
  };
}

const OPTIONS: { key: Tier | "all"; label: string; caption: string }[] = [
  { key: "all", label: "All coverage", caption: "Every tier combined" },
  { key: "regulators", label: "Regulators", caption: "Tracked agencies & authorities" },
  { key: "rulebooks", label: "Rulebooks", caption: "Fully consolidated publishers" },
  { key: "legislation", label: "Legislation", caption: "Federal & state legislatures" },
  { key: "exchanges", label: "Exchanges", caption: "Stock, clearing & derivatives" },
];

export function TierTabs({ value, onChange, counts }: Props) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
      {OPTIONS.map((opt) => {
        const active = value === opt.key;
        const n = counts[opt.key];
        return (
          <button
            key={opt.key}
            onClick={() => onChange(opt.key)}
            className={clsx(
              "group relative rounded-xl2 border bg-white px-4 py-3 text-left transition-all focus-ring",
              active
                ? "border-brand-teal/50 shadow-lift"
                : "border-ink-100 hover:border-ink-200 hover:shadow-soft"
            )}
          >
            <div className="flex items-center justify-between">
              <span
                className={clsx(
                  "text-sm font-semibold tracking-tight",
                  active ? "text-brand-deep" : "text-ink-800"
                )}
              >
                {opt.label}
              </span>
              <span
                className={clsx(
                  "tabular-nums text-sm font-semibold",
                  active ? "text-brand-teal" : "text-ink-400"
                )}
              >
                {n.toLocaleString()}
              </span>
            </div>
            <div className="mt-1 text-xs text-ink-500">{opt.caption}</div>
            {active && (
              <div className="absolute inset-x-4 -bottom-px h-[2px] rounded-full bg-brand-teal" />
            )}
          </button>
        );
      })}
    </div>
  );
}
