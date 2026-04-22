"use client";

import { useMemo, useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from "react-simple-maps";
import { scaleThreshold } from "d3-scale";
import clsx from "clsx";
import type { CountryAggregate, Tier } from "@/lib/types";

const GEO_URL =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// TopoJSON uses numeric ISO-3166-1 codes as the `id`. We need to map those
// to the ISO-3 alpha codes we use in the coverage data. This is built in.
import { NUMERIC_TO_ISO3 } from "@/lib/isoNumeric";

interface Props {
  byIso: Record<string, CountryAggregate>;
  activeTier: Tier | "all";
  selectedIso: string | null;
  onSelect: (iso3: string | null) => void;
}

export function WorldMap({ byIso, activeTier, selectedIso, onSelect }: Props) {
  const [hoverIso, setHoverIso] = useState<string | null>(null);

  const countFor = (iso3: string | null): number => {
    if (!iso3) return 0;
    const c = byIso[iso3];
    if (!c) return 0;
    return activeTier === "all" ? c.total : c[activeTier];
  };

  const { colorScale, legendStops } = useMemo(() => {
    const values = Object.values(byIso)
      .map((c) => (activeTier === "all" ? c.total : c[activeTier]))
      .filter((n) => n > 0)
      .sort((a, b) => a - b);

    const stops: number[] =
      values.length === 0
        ? [1]
        : activeTier === "regulators" || activeTier === "all"
        ? [1, 3, 6, 12, 25]
        : activeTier === "rulebooks"
        ? [1, 2, 4, 8, 20]
        : activeTier === "legislation"
        ? [1, 2, 5, 15, 40]
        : [1, 2, 3];

    const greens = ["#EDF8F4", "#BFE5D8", "#9DDFD4", "#4BB8A8", "#1F7E67", "#003A42"];
    const range = greens.slice(0, stops.length + 1);
    const scale = scaleThreshold<number, string>().domain(stops).range(range);
    return { colorScale: scale, legendStops: stops };
  }, [byIso, activeTier]);

  return (
    <div className="relative">
      <div className="rounded-xl2 border border-ink-100 bg-white shadow-soft overflow-hidden">
        <ComposableMap
          projection="geoEqualEarth"
          projectionConfig={{ scale: 170 }}
          width={980}
          height={440}
          style={{ width: "100%", height: "auto" }}
        >
          <ZoomableGroup
            center={[10, 10]}
            zoom={1}
            minZoom={1}
            maxZoom={4}
            // Let normal two-finger scroll pass through to the page. Only the
            // pinch gesture (which the browser reports as a wheel event with
            // ctrlKey=true on macOS / Chrome / Safari) zooms the map.
            filterZoomEvent={(event) => {
              const e = event as unknown as WheelEvent;
              if (e.type === "wheel") return e.ctrlKey === true;
              return true;
            }}
          >
            <Geographies geography={GEO_URL}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const numeric = String(geo.id).padStart(3, "0");
                  const iso3 = NUMERIC_TO_ISO3[numeric] ?? null;
                  const n = countFor(iso3);
                  const isSelected = iso3 && selectedIso === iso3;
                  const isHover = iso3 && hoverIso === iso3;
                  const fill =
                    n > 0 ? colorScale(n) : "#F1F5F4";
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      onMouseEnter={() => iso3 && setHoverIso(iso3)}
                      onMouseLeave={() => setHoverIso(null)}
                      onClick={() => {
                        if (!iso3) return;
                        onSelect(isSelected ? null : iso3);
                      }}
                      style={{
                        default: {
                          fill,
                          stroke: "#ffffff",
                          strokeWidth: 0.6,
                          outline: "none",
                          cursor: n > 0 ? "pointer" : "default",
                        },
                        hover: {
                          fill: n > 0 ? "#0B8B7A" : "#E7EEED",
                          stroke: "#ffffff",
                          strokeWidth: 0.8,
                          outline: "none",
                          cursor: n > 0 ? "pointer" : "default",
                        },
                        pressed: {
                          fill: "#003A42",
                          outline: "none",
                        },
                      }}
                      className={clsx(
                        "transition-[fill] duration-150",
                        isSelected && "!stroke-brand-deep"
                      )}
                    />
                  );
                })
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>

        {/* Hover tooltip — minimal, corner-pinned for screen-share clarity */}
        {hoverIso && byIso[hoverIso] && (
          <div className="pointer-events-none absolute top-4 left-4 rounded-lg bg-ink-900/95 px-3 py-2 text-sm text-white shadow-lift">
            <div className="font-semibold">{byIso[hoverIso].country}</div>
            <div className="mt-0.5 text-ink-200">
              {activeTier === "all"
                ? `${byIso[hoverIso].total} total`
                : `${byIso[hoverIso][activeTier]} ${labelFor(activeTier, byIso[hoverIso][activeTier])}`}
            </div>
          </div>
        )}
      </div>

      <Legend stops={legendStops} colorScale={colorScale} activeTier={activeTier} />
    </div>
  );
}

function labelFor(tier: Tier | "all", n: number): string {
  if (tier === "regulators") return n === 1 ? "regulator" : "regulators";
  if (tier === "rulebooks") return n === 1 ? "rulebook" : "rulebooks";
  if (tier === "legislation") return n === 1 ? "legislature" : "legislatures";
  if (tier === "exchanges") return n === 1 ? "exchange" : "exchanges";
  return n === 1 ? "entry" : "entries";
}

function Legend({
  stops,
  colorScale,
  activeTier,
}: {
  stops: number[];
  colorScale: (n: number) => string;
  activeTier: Tier | "all";
}) {
  const boundaries = [0, ...stops];
  return (
    <div className="mt-3 flex items-center gap-3 text-xs text-ink-500">
      <span>Coverage</span>
      <div className="flex items-center gap-1">
        {boundaries.map((b, i) => {
          const next = boundaries[i + 1];
          const sample = next ? (b + next) / 2 : b + 1;
          const label = next
            ? `${b}${b > 0 ? "+" : ""}`
            : `${b}+`;
          return (
            <div key={i} className="flex items-center gap-1">
              <span
                className="h-3 w-5 rounded-sm"
                style={{
                  background: b === 0 ? "#F1F5F4" : colorScale(sample),
                  border: "1px solid rgba(15,23,42,0.06)",
                }}
              />
              <span className="tabular-nums">{label}</span>
            </div>
          );
        })}
      </div>
      <span className="ml-auto text-ink-400">
        {activeTier === "all" ? "all tiers combined" : `tier: ${activeTier}`}
      </span>
    </div>
  );
}
