"use client";

import clsx from "clsx";
import type { Region } from "@/lib/types";

interface Props {
  value: Region | "all";
  onChange: (r: Region | "all") => void;
}

const REGIONS: { key: Region | "all"; label: string }[] = [
  { key: "all", label: "All regions" },
  { key: "Americas", label: "Americas" },
  { key: "EMEA", label: "EMEA" },
  { key: "APAC", label: "APAC" },
];

export function RegionFilter({ value, onChange }: Props) {
  return (
    <div className="inline-flex items-center rounded-full border border-ink-100 bg-white p-1 shadow-soft">
      {REGIONS.map((r) => {
        const active = value === r.key;
        return (
          <button
            key={r.key}
            onClick={() => onChange(r.key)}
            className={clsx(
              "rounded-full px-3 py-1.5 text-sm font-medium transition-all focus-ring",
              active
                ? "bg-brand-deep text-white shadow-soft"
                : "text-ink-600 hover:text-ink-900"
            )}
          >
            {r.label}
          </button>
        );
      })}
    </div>
  );
}
