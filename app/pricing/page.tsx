import { getCoverage } from "@/lib/data";
import { PricingCalculator } from "@/app/components/PricingCalculator";
import { CoverageRequestCTA } from "@/app/components/CoverageRequestCTA";

export const metadata = {
  title: "SAI360 · Content Pricing",
  description:
    "Interactive pricing for the SAI360 Regulatory and Legislative Content subscriptions.",
};

export default function PricingPage() {
  const data = getCoverage();
  return (
    <div className="mx-auto w-full max-w-page px-5 md:px-8 lg:px-12 pb-20">
      <section className="mt-8 md:mt-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-brand-sky/40 bg-brand-pale px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-brand-deep">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-teal" />
          Content Pricing
        </div>
        <h1 className="mt-3 text-display-lg text-ink-900">
          Price it by <span className="text-brand-teal">what you track.</span>
        </h1>
        <p className="mt-3 max-w-2xl text-[17px] leading-relaxed text-ink-500">
          Regulatory content is priced per regulatory agency (regardless of
          jurisdiction). Legislative content is priced per jurisdiction. Drag
          the sliders below to scope a live quote.
        </p>
      </section>

      <section className="mt-8">
        <PricingCalculator pricing={data.pricing} regulators={data.regulators} />
      </section>

      <CoverageRequestCTA variant="compact" />

      <footer className="mt-16 border-t border-ink-100 pt-6 text-xs text-ink-400">
        SKUs sourced from the internal pricing sheet ·{" "}
        {data.pricing.length} active tiers ·{" "}
        Quotes shown are list price, annual subscription, USD.
      </footer>
    </div>
  );
}
