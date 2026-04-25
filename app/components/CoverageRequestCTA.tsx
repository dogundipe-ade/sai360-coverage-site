// Shared objection-handler card. Lives on both the coverage and pricing
// pages so prospects never finish a demo thinking "but you don't cover X".
//
// To change the destination email, edit REQUEST_EMAIL below.

const REQUEST_EMAIL = "coverage@sai360.com";

const SUBJECT = "Coverage request — missing regulator";
const BODY =
  "Hi SAI360 team,%0D%0A%0D%0A" +
  "We'd like coverage for the following regulator(s):%0D%0A" +
  "  - [regulator name]%0D%0A" +
  "  - [jurisdiction]%0D%0A%0D%0A" +
  "Thanks!";

export function CoverageRequestCTA({
  variant = "full",
}: {
  variant?: "full" | "compact";
}) {
  const href = `mailto:${REQUEST_EMAIL}?subject=${encodeURIComponent(SUBJECT)}&body=${BODY}`;
  if (variant === "compact") {
    return (
      <div className="mt-10 rounded-xl2 border border-ink-100 bg-white p-5 text-sm text-ink-600 shadow-soft sm:flex sm:items-center sm:justify-between sm:gap-6">
        <div>
          <span className="font-semibold text-ink-900">
            Don&apos;t see a regulator you need?
          </span>{" "}
          We add 20–30 new regulators per quarter based on customer requests.
        </div>
        <a
          href={href}
          className="mt-3 inline-flex shrink-0 items-center gap-1.5 rounded-full bg-brand-deep px-4 py-2 text-sm font-semibold text-white shadow-soft transition-colors hover:bg-brand-teal focus-ring sm:mt-0"
        >
          Request coverage
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      </div>
    );
  }
  return (
    <div className="mt-12 overflow-hidden rounded-xl2 border border-brand-sky/40 bg-gradient-to-br from-brand-pale to-white p-8 shadow-soft">
      <div className="grid gap-6 md:grid-cols-[1fr,auto] md:items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-sky/40 bg-white/70 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-brand-deep">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-teal" />
            Expanding coverage
          </div>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-ink-900 sm:text-[28px]">
            Don&apos;t see a regulator you need?
          </h2>
          <p className="mt-2 max-w-2xl text-[15.5px] leading-relaxed text-ink-600">
            We add <span className="font-semibold text-ink-900">20–30 new regulators per quarter</span> based
            on customer requests. Send us the name and jurisdiction — your
            account team will confirm the scoping timeline, typically{" "}
            <span className="font-semibold text-ink-900">4–6 weeks</span> from
            request to live coverage.
          </p>
        </div>
        <a
          href={href}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-deep px-5 py-3 text-sm font-semibold text-white shadow-soft transition-colors hover:bg-brand-teal focus-ring md:self-center"
        >
          Request coverage
          <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      </div>
    </div>
  );
}
