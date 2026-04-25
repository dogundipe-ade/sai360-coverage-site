"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import clsx from "clsx";
import type { BundleKey, CoverageEntry, PricingSku } from "@/lib/types";
import { useCart, type CartRegulator } from "@/lib/cart";
import { PersonaPresets } from "./PersonaPresets";

type Family = "Regulatory Content" | "Legislative Content";

// Generous upper ceiling on each slider so reps can demonstrate "we go well
// past the included tiers" for enterprise accounts.
const SLIDER_CEIL: Record<Family, number> = {
  "Regulatory Content": 120,
  "Legislative Content": 80,
};

// Fallback defaults if the cart is empty.
const SLIDER_DEFAULT: Record<Family, number> = {
  "Regulatory Content": 25,
  "Legislative Content": 20,
};

const FAMILY_META: Record<Family, { blurb: string; unitLabel: string }> = {
  "Regulatory Content": {
    blurb:
      "Continuous regulator-notice coverage — enforcement actions, rule changes, consultations — delivered via API.",
    unitLabel: "regulators tracked",
  },
  "Legislative Content": {
    blurb:
      "Bills, statutes, and legislative tracking across federal and state jurisdictions.",
    unitLabel: "jurisdictions tracked",
  },
};

const BUNDLE_META: Record<BundleKey, { title: string; blurb: string }> = {
  rulebooks: {
    title: "Consolidated Rulebooks",
    blurb:
      "Full rulebook text from every publisher in your coverage — searchable, versioned, mapped to regulator alerts.",
  },
  exchanges: {
    title: "Exchange Rules",
    blurb:
      "Listing, trading, and market-structure rules for every exchange in the SAI360 universe.",
  },
};

// Given the SKUs for one priced family and the requested count, return the
// matching tier. >N wins when count strictly exceeds every numbered threshold.
function pickTier(skus: PricingSku[], count: number): PricingSku | undefined {
  const sized = skus
    .filter((s) => s.threshold != null)
    .sort((a, b) => (a.threshold! - b.threshold!));
  const over = skus.find((s) => s.isCustom);
  for (const s of sized) {
    if (count <= (s.threshold ?? 0)) return s;
  }
  return over ?? sized[sized.length - 1];
}

export function PricingCalculator({
  pricing,
  regulators,
}: {
  pricing: PricingSku[];
  regulators: CoverageEntry[];
}) {
  const cart = useCart();

  const pricedByFamily = useMemo(() => {
    const out: Record<Family, PricingSku[]> = {
      "Regulatory Content": [],
      "Legislative Content": [],
    };
    for (const s of pricing) {
      if (s.isBundle) continue;
      if (s.family in out) out[s.family as Family].push(s);
    }
    return out;
  }, [pricing]);

  const bundles = useMemo(() => {
    const out: Partial<Record<BundleKey, PricingSku>> = {};
    for (const s of pricing) {
      if (s.isBundle && s.bundleKey) out[s.bundleKey] = s;
    }
    return out;
  }, [pricing]);

  const regulatorCount = cart.count;

  // If the cart is empty we fall back to a non-zero default so the page
  // always lands on a meaningful price. Once the user has a cart, the cart
  // drives the slider.
  const [regOverride, setRegOverride] = useState<number | null>(null);
  const [legCount, setLegCount] = useState(
    SLIDER_DEFAULT["Legislative Content"]
  );
  const [enabled, setEnabled] = useState<Record<Family, boolean>>({
    "Regulatory Content": true,
    "Legislative Content": true,
  });

  const effectiveRegCount =
    regOverride ??
    (regulatorCount > 0 ? regulatorCount : SLIDER_DEFAULT["Regulatory Content"]);

  const regTier = pickTier(pricedByFamily["Regulatory Content"], effectiveRegCount);
  const legTier = pickTier(pricedByFamily["Legislative Content"], legCount);

  const regLine = enabled["Regulatory Content"] ? regTier : undefined;
  const legLine = enabled["Legislative Content"] ? legTier : undefined;
  const rbLine = cart.bundles.rulebooks ? bundles.rulebooks : undefined;
  const exLine = cart.bundles.exchanges ? bundles.exchanges : undefined;

  const lineItems = [regLine, legLine, rbLine, exLine].filter(
    (t): t is PricingSku => !!t
  );

  const annualTotal = lineItems
    .filter((t) => !t.isCustom && t.price != null)
    .reduce((sum, t) => sum + (t.price as number), 0);
  const anyCustom = lineItems.some((t) => t.isCustom);
  const anyIncluded = lineItems.length > 0;

  const regulatorsByCountry = useMemo(
    () => groupByCountry(Object.values(cart.regulators)),
    [cart.regulators]
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr,380px]">
      <div className="space-y-6">
        <PersonaPresets
          regulators={regulators}
          onApply={(legCount) => {
            setLegCount(legCount);
            setRegOverride(null);
            setEnabled({
              "Regulatory Content": true,
              "Legislative Content": true,
            });
          }}
        />
        <RegulatorFamilyCard
          skus={pricedByFamily["Regulatory Content"]}
          ceiling={SLIDER_CEIL["Regulatory Content"]}
          cartCount={regulatorCount}
          effectiveCount={effectiveRegCount}
          overrideActive={regOverride != null}
          onOverride={setRegOverride}
          onClearOverride={() => setRegOverride(null)}
          enabled={enabled["Regulatory Content"]}
          onToggleEnabled={(v) =>
            setEnabled((prev) => ({ ...prev, "Regulatory Content": v }))
          }
        />
        <LegislativeFamilyCard
          skus={pricedByFamily["Legislative Content"]}
          ceiling={SLIDER_CEIL["Legislative Content"]}
          count={legCount}
          onChange={setLegCount}
          enabled={enabled["Legislative Content"]}
          onToggleEnabled={(v) =>
            setEnabled((prev) => ({ ...prev, "Legislative Content": v }))
          }
        />
        <BundleToggleCard bundleKey="rulebooks" sku={bundles.rulebooks} />
        <BundleToggleCard bundleKey="exchanges" sku={bundles.exchanges} />
      </div>

      <aside className="lg:sticky lg:top-6 h-fit">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-brand-deep">
              Your quote
            </div>
            {(cart.count > 0 ||
              cart.bundles.rulebooks ||
              cart.bundles.exchanges) && (
              <button
                type="button"
                onClick={() => {
                  if (
                    window.confirm(
                      "Clear all selections and reset bundle toggles? This can't be undone."
                    )
                  ) {
                    cart.clear();
                  }
                }}
                className="text-[11px] font-medium text-ink-400 hover:text-rose-700 focus-ring rounded-md"
              >
                Reset quote
              </button>
            )}
          </div>

          <div className="mt-4 space-y-4">
            <QuoteLine
              label="Regulatory Content"
              sku={regLine}
              detailAbove={
                regulatorCount > 0
                  ? `${regulatorCount} regulator${regulatorCount === 1 ? "" : "s"} selected`
                  : `${effectiveRegCount} regulators (estimate)`
              }
              included={enabled["Regulatory Content"]}
            />
            <QuoteLine
              label="Legislative Content"
              sku={legLine}
              detailAbove={`${legCount} jurisdiction${legCount === 1 ? "" : "s"}`}
              included={enabled["Legislative Content"]}
            />
            <QuoteLine
              label="Consolidated Rulebooks"
              sku={bundles.rulebooks}
              included={cart.bundles.rulebooks}
              detailAbove="Bundle add-on"
            />
            <QuoteLine
              label="Exchange Rules"
              sku={bundles.exchanges}
              included={cart.bundles.exchanges}
              detailAbove="Bundle add-on"
            />
          </div>

          <div className="mt-6 border-t border-ink-100 pt-4">
            <div className="flex items-baseline justify-between">
              <div className="text-sm font-medium text-ink-500">
                Annual total
              </div>
              <div className="text-right">
                {anyIncluded ? (
                  <>
                    <div className="text-3xl font-semibold tabular-nums tracking-tight text-ink-900">
                      {annualTotal > 0
                        ? `$${annualTotal.toLocaleString()}`
                        : anyCustom
                          ? "Custom"
                          : "—"}
                    </div>
                    {anyCustom && annualTotal > 0 && (
                      <div className="text-xs text-ink-500">
                        + custom-quoted tier
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-ink-400 text-sm">
                    Enable a product to see pricing
                  </div>
                )}
              </div>
            </div>

            <CopyQuoteButton
              lineItems={lineItems}
              annualTotal={annualTotal}
              anyCustom={anyCustom}
              regulatorsByCountry={regulatorsByCountry}
              effectiveRegCount={effectiveRegCount}
              legCount={legCount}
            />

            {cart.count === 0 && (
              <div className="mt-4 rounded-xl2 border border-dashed border-ink-200 bg-surface-muted/40 p-3 text-[12px] leading-relaxed text-ink-500">
                Tip: head to the{" "}
                <Link
                  href="/"
                  className="font-medium text-brand-deep underline-offset-2 hover:underline"
                >
                  Coverage map
                </Link>{" "}
                and click <span className="font-semibold">+</span> next to the
                regulators you care about. Your selections drive the quote.
              </div>
            )}

            <p className="mt-4 text-[12px] leading-relaxed text-ink-400">
              List pricing, annual subscription, USD. Custom-tier engagements
              are scoped and quoted by your SAI360 account team.
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}

function RegulatorFamilyCard({
  skus,
  ceiling,
  cartCount,
  effectiveCount,
  overrideActive,
  onOverride,
  onClearOverride,
  enabled,
  onToggleEnabled,
}: {
  skus: PricingSku[];
  ceiling: number;
  cartCount: number;
  effectiveCount: number;
  overrideActive: boolean;
  onOverride: (n: number) => void;
  onClearOverride: () => void;
  enabled: boolean;
  onToggleEnabled: (v: boolean) => void;
}) {
  const tier = pickTier(skus, effectiveCount);
  return (
    <div className={clsx("card p-6 transition-opacity", !enabled && "opacity-60")}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-brand-deep">
            Regulatory Content
          </div>
          <p className="mt-1 max-w-xl text-sm text-ink-500">
            {FAMILY_META["Regulatory Content"].blurb}
          </p>
        </div>
        <Switch
          checked={enabled}
          onChange={onToggleEnabled}
          label="Include Regulatory Content"
        />
      </div>

      <div className="mt-5">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-ink-400">
              {cartCount > 0
                ? "Regulators in your cart"
                : FAMILY_META["Regulatory Content"].unitLabel}
            </div>
            <div className="mt-0.5 text-3xl font-semibold tabular-nums tracking-tight text-ink-900">
              {effectiveCount}
              {effectiveCount >= ceiling && <span className="text-ink-400">+</span>}
              {cartCount > 0 && !overrideActive && (
                <span className="ml-2 align-middle text-[11px] font-semibold uppercase tracking-wider text-brand-teal">
                  from cart
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs font-medium uppercase tracking-wider text-ink-400">
              Tier
            </div>
            <div className="mt-0.5 text-sm font-medium text-ink-700">
              {tier?.tier ?? "—"}
            </div>
          </div>
        </div>

        <input
          type="range"
          min={1}
          max={ceiling}
          value={Math.min(effectiveCount, ceiling)}
          onChange={(e) => onOverride(Number(e.target.value))}
          disabled={!enabled}
          aria-label="Preview a different tier"
          className="mt-4 w-full accent-brand-teal"
        />
        <div className="mt-1 flex items-center justify-between text-[11px] text-ink-400">
          <span>
            Drag to preview another tier
            {overrideActive && (
              <>
                {" · "}
                <button
                  type="button"
                  onClick={onClearOverride}
                  className="font-semibold text-brand-deep hover:underline focus-ring rounded"
                >
                  reset to cart
                </button>
              </>
            )}
          </span>
          <span>1 — {ceiling}+</span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {skus.map((s) => {
            const isActive = tier?.tier === s.tier;
            return (
              <button
                key={`${s.sku}-${s.tier}`}
                type="button"
                onClick={() => {
                  if (s.threshold != null) onOverride(s.threshold);
                  else if (s.overFloor != null) onOverride(s.overFloor + 1);
                }}
                className={clsx(
                  "rounded-xl2 border p-3 text-left transition-all focus-ring",
                  isActive
                    ? "border-brand-teal bg-brand-pale/60 shadow-soft"
                    : "border-ink-100 bg-white hover:border-ink-200"
                )}
              >
                <div className="text-[11px] font-medium uppercase tracking-wider text-ink-400">
                  {s.tier}
                </div>
                <div className="mt-1 text-base font-semibold tabular-nums text-ink-900">
                  {s.isCustom
                    ? "Custom"
                    : s.price != null
                      ? `$${s.price.toLocaleString()}`
                      : "—"}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function LegislativeFamilyCard({
  skus,
  ceiling,
  count,
  onChange,
  enabled,
  onToggleEnabled,
}: {
  skus: PricingSku[];
  ceiling: number;
  count: number;
  onChange: (n: number) => void;
  enabled: boolean;
  onToggleEnabled: (v: boolean) => void;
}) {
  const tier = pickTier(skus, count);
  return (
    <div className={clsx("card p-6 transition-opacity", !enabled && "opacity-60")}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-brand-deep">
            Legislative Content
          </div>
          <p className="mt-1 max-w-xl text-sm text-ink-500">
            {FAMILY_META["Legislative Content"].blurb}
          </p>
        </div>
        <Switch
          checked={enabled}
          onChange={onToggleEnabled}
          label="Include Legislative Content"
        />
      </div>

      <div className="mt-5">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-ink-400">
              {FAMILY_META["Legislative Content"].unitLabel}
            </div>
            <div className="mt-0.5 text-3xl font-semibold tabular-nums tracking-tight text-ink-900">
              {count}
              {count >= ceiling && <span className="text-ink-400">+</span>}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs font-medium uppercase tracking-wider text-ink-400">
              Tier
            </div>
            <div className="mt-0.5 text-sm font-medium text-ink-700">
              {tier?.tier ?? "—"}
            </div>
          </div>
        </div>

        <input
          type="range"
          min={1}
          max={ceiling}
          value={Math.min(count, ceiling)}
          onChange={(e) => onChange(Number(e.target.value))}
          disabled={!enabled}
          aria-label="Number of jurisdictions"
          className="mt-4 w-full accent-brand-teal"
        />

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {skus.map((s) => {
            const isActive = tier?.tier === s.tier;
            return (
              <button
                key={`${s.sku}-${s.tier}`}
                type="button"
                onClick={() => {
                  if (s.threshold != null) onChange(s.threshold);
                  else if (s.overFloor != null) onChange(s.overFloor + 1);
                }}
                className={clsx(
                  "rounded-xl2 border p-3 text-left transition-all focus-ring",
                  isActive
                    ? "border-brand-teal bg-brand-pale/60 shadow-soft"
                    : "border-ink-100 bg-white hover:border-ink-200"
                )}
              >
                <div className="text-[11px] font-medium uppercase tracking-wider text-ink-400">
                  {s.tier}
                </div>
                <div className="mt-1 text-base font-semibold tabular-nums text-ink-900">
                  {s.isCustom
                    ? "Custom"
                    : s.price != null
                      ? `$${s.price.toLocaleString()}`
                      : "—"}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function BundleToggleCard({
  bundleKey,
  sku,
}: {
  bundleKey: BundleKey;
  sku: PricingSku | undefined;
}) {
  const cart = useCart();
  const on = cart.bundles[bundleKey];
  const meta = BUNDLE_META[bundleKey];
  if (!sku) return null;
  return (
    <div
      className={clsx(
        "card p-6 transition-all",
        on ? "border-brand-teal/40 ring-1 ring-brand-teal/20" : ""
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-brand-deep">
            {meta.title}
          </div>
          <p className="mt-1 max-w-xl text-sm text-ink-500">{meta.blurb}</p>
          <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-surface-muted px-2.5 py-1 text-xs text-ink-600">
            Flat annual add-on ·{" "}
            <span className="font-semibold tabular-nums text-ink-900">
              ${sku.price?.toLocaleString()}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-wider text-ink-400">
              {sku.sku}
            </span>
          </div>
        </div>
        <Switch
          checked={on}
          onChange={(v) => cart.setBundle(bundleKey, v)}
          label={`Include ${meta.title}`}
        />
      </div>
    </div>
  );
}

function QuoteLine({
  label,
  sku,
  detailAbove,
  included,
}: {
  label: string;
  sku?: PricingSku;
  detailAbove?: string;
  included: boolean;
}) {
  return (
    <div
      className={clsx(
        "flex items-start justify-between gap-4",
        !included && "opacity-50"
      )}
    >
      <div className="min-w-0">
        <div className="text-sm font-medium text-ink-800">{label}</div>
        {detailAbove && <div className="text-xs text-ink-500">{detailAbove}</div>}
        {sku?.tier && included && (
          <div className="text-xs text-ink-500">{sku.tier}</div>
        )}
        {sku?.sku && included && (
          <div className="mt-1 text-[11px] font-mono uppercase tracking-wider text-ink-400">
            {sku.sku}
          </div>
        )}
      </div>
      <div className="text-right tabular-nums shrink-0">
        {!included ? (
          <span className="text-ink-400 text-sm">excluded</span>
        ) : sku?.isCustom ? (
          <span className="text-sm font-semibold text-ink-700">Custom</span>
        ) : sku?.price != null ? (
          <span className="text-sm font-semibold text-ink-900">
            ${sku.price.toLocaleString()}
          </span>
        ) : (
          <span className="text-ink-400 text-sm">—</span>
        )}
      </div>
    </div>
  );
}

function CopyQuoteButton({
  lineItems,
  annualTotal,
  anyCustom,
  regulatorsByCountry,
  effectiveRegCount,
  legCount,
}: {
  lineItems: PricingSku[];
  annualTotal: number;
  anyCustom: boolean;
  regulatorsByCountry: { country: string; items: CartRegulator[] }[];
  effectiveRegCount: number;
  legCount: number;
}) {
  const [copied, setCopied] = useState<"idle" | "ok" | "err">("idle");

  const buildQuoteText = () => {
    const today = new Date().toISOString().slice(0, 10);
    const lines: string[] = [];
    lines.push("SAI360 — Proposed Coverage");
    lines.push(`Prepared ${today}`);
    lines.push("");
    for (const t of lineItems) {
      const priceStr = t.isCustom
        ? "Custom"
        : t.price != null
          ? `$${t.price.toLocaleString()}/yr`
          : "—";
      lines.push(`${t.family} — ${t.tier} (${priceStr})`);
      if (t.sku) lines.push(`  SKU: ${t.sku}`);
      if (t.family === "Regulatory Content" && regulatorsByCountry.length > 0) {
        for (const group of regulatorsByCountry) {
          lines.push(`  ${group.country}:`);
          for (const r of group.items) {
            lines.push(`    · ${r.name}`);
          }
        }
      } else if (
        t.family === "Regulatory Content" &&
        regulatorsByCountry.length === 0
      ) {
        lines.push(`  (${effectiveRegCount} regulators — not yet itemized)`);
      } else if (t.family === "Legislative Content") {
        lines.push(`  ${legCount} jurisdictions`);
      }
      lines.push("");
    }
    const totalStr =
      annualTotal > 0
        ? `$${annualTotal.toLocaleString()}${anyCustom ? " + custom-quoted tier" : ""}`
        : anyCustom
          ? "Custom"
          : "—";
    lines.push(`Annual total: ${totalStr} USD`);
    lines.push("");
    lines.push("List pricing, annual subscription. Custom tiers quoted by account team.");
    return lines.join("\n");
  };

  const handleCopy = async () => {
    const text = buildQuoteText();
    try {
      await navigator.clipboard.writeText(text);
      setCopied("ok");
      setTimeout(() => setCopied("idle"), 1800);
    } catch {
      setCopied("err");
      setTimeout(() => setCopied("idle"), 1800);
    }
  };

  if (lineItems.length === 0) return null;

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={clsx(
        "mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl2 px-3.5 py-2.5 text-sm font-semibold transition-all focus-ring",
        copied === "ok"
          ? "bg-brand-teal text-white"
          : copied === "err"
            ? "bg-ink-100 text-ink-800"
            : "bg-brand-deep text-white hover:bg-brand-teal"
      )}
    >
      {copied === "ok" ? (
        <>
          <svg viewBox="0 0 14 14" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.4">
            <path d="M3 7.5l3 3 5-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Copied to clipboard
        </>
      ) : copied === "err" ? (
        "Copy failed — try again"
      ) : (
        <>
          <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="4" y="4" width="9" height="9" rx="1.5" />
            <path d="M3 11V3a1 1 0 0 1 1-1h8" />
          </svg>
          Copy quote to clipboard
        </>
      )}
    </button>
  );
}

function groupByCountry(
  regulators: CartRegulator[]
): { country: string; items: CartRegulator[] }[] {
  const out: Record<string, CartRegulator[]> = {};
  for (const r of regulators) {
    const key = r.country || "Unspecified";
    if (!out[key]) out[key] = [];
    out[key].push(r);
  }
  return Object.entries(out)
    .map(([country, items]) => ({
      country,
      items: items.slice().sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => b.items.length - a.items.length || a.country.localeCompare(b.country));
}

function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={clsx(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-ring",
        checked ? "bg-brand-teal" : "bg-ink-200"
      )}
    >
      <span
        className={clsx(
          "inline-block h-5 w-5 transform rounded-full bg-white shadow-soft transition-transform",
          checked ? "translate-x-5" : "translate-x-0.5"
        )}
      />
    </button>
  );
}
