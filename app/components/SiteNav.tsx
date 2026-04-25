"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { useCart } from "@/lib/cart";

const TABS = [
  { href: "/", label: "Coverage" },
  { href: "/pricing", label: "Content Pricing" },
];

export function SiteNav() {
  const pathname = usePathname();
  const cart = useCart();
  const { count, hydrated, bundles } = cart;
  // "Something to clear" = any regulator in the cart OR either bundle toggled on.
  const hasAny =
    hydrated && (count > 0 || bundles.rulebooks || bundles.exchanges);

  const handleReset = () => {
    if (
      window.confirm(
        "Clear all selections and reset bundle toggles? This can't be undone."
      )
    ) {
      cart.clear();
    }
  };

  return (
    <header className="mx-auto w-full max-w-page px-5 md:px-8 lg:px-12 pt-8 md:pt-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Brand />
        <nav aria-label="Primary" className="inline-flex items-center rounded-full border border-ink-100 bg-white p-1 shadow-soft">
          {TABS.map((t) => {
            const active =
              t.href === "/"
                ? pathname === "/"
                : pathname.startsWith(t.href);
            return (
              <Link
                key={t.href}
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={clsx(
                  "inline-flex items-center rounded-full px-3.5 py-1.5 text-sm font-medium transition-all focus-ring",
                  active
                    ? "bg-brand-deep text-white shadow-soft"
                    : "text-ink-600 hover:text-ink-900"
                )}
              >
                {t.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/pricing"
            className={clsx(
              "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-all focus-ring",
              hydrated && count > 0
                ? "border-brand-teal/40 bg-brand-pale text-brand-deep shadow-soft"
                : "border-ink-100 bg-white text-ink-500 hover:text-ink-800"
            )}
            aria-label="View selections"
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M4 4h2l1.5 9.5a1 1 0 0 0 1 .83H15a1 1 0 0 0 1-.84L17 7H6" strokeLinejoin="round" strokeLinecap="round" />
              <circle cx="9" cy="17" r="1" fill="currentColor" />
              <circle cx="15" cy="17" r="1" fill="currentColor" />
            </svg>
            <span className="tabular-nums">
              Selections
              {hydrated && count > 0 && (
                <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-teal px-1.5 text-[11px] font-semibold text-white">
                  {count}
                </span>
              )}
            </span>
          </Link>
          {hasAny && (
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 rounded-full border border-ink-100 bg-white px-3 py-1.5 text-sm font-medium text-ink-500 transition-all hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 focus-ring"
              title="Clear selections — use between demos"
            >
              <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M4 7h12M9 4h2M8 7v8m4-8v8M6 7l.7 9a1 1 0 0 0 1 .9h4.6a1 1 0 0 0 1-.9L14 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Reset
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-3 focus-ring rounded-md">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/sai360-logo.svg" alt="SAI360" className="h-8 w-auto" />
      <div className="hidden sm:block border-l border-ink-200 pl-3 leading-tight">
        <div className="text-[11px] font-medium uppercase tracking-wider text-ink-400">
          Regulatory &amp; Legislative Content
        </div>
      </div>
    </Link>
  );
}
