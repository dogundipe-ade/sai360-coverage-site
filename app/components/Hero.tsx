import type { CoverageData } from "@/lib/types";

export function Hero({ summary }: { summary: CoverageData["summary"] }) {
  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-brand-sky/40 bg-brand-pale px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-brand-deep">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-teal" />
          SAI360 Regulatory &amp; Legislative Content
        </div>
        <h1 className="mt-3 text-display-lg text-ink-900">
          Regulatory &amp; legislative coverage,{" "}
          <span className="text-brand-teal">across the globe.</span>
        </h1>
        <p className="mt-3 max-w-2xl text-[17px] leading-relaxed text-ink-500">
          Every regulator, legislature, consolidated rulebook, and exchange in
          the SAI360 universe — explore by country, filter by tier, or search
          in plain language.
        </p>
      </div>
      <div className="grid grid-cols-3 gap-2 sm:gap-4 shrink-0">
        <Stat label="Jurisdictions" value={summary.jurisdictions} />
        <Stat label="Regulators" value={summary.regulators} />
        <Stat
          label="Rulebooks · Legislation · Exchanges"
          value={summary.rulebooks + summary.legislation + summary.exchanges}
        />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="card px-4 py-3 text-right min-w-[110px]">
      <div className="text-xs font-medium uppercase tracking-wider text-ink-400">
        {label}
      </div>
      <div className="mt-0.5 text-2xl font-semibold tabular-nums tracking-tight text-ink-900">
        {value.toLocaleString()}
      </div>
    </div>
  );
}
