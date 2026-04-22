"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onChange, placeholder }: Props) {
  const [focused, setFocused] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        ref.current?.focus();
      }
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        ref.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div
      className={clsx(
        "flex items-center gap-2.5 rounded-xl2 border bg-white px-3.5 py-2.5 shadow-soft transition-all",
        focused
          ? "border-brand-teal/40 ring-2 ring-brand-teal/20"
          : "border-ink-100 hover:border-ink-200"
      )}
    >
      <svg
        viewBox="0 0 20 20"
        className="h-4 w-4 shrink-0 text-ink-400"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="9" cy="9" r="6" />
        <path d="M14 14l4 4" strokeLinecap="round" />
      </svg>
      <input
        ref={ref}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder ?? "Ask in plain English — try \u201Cregulators in Canada and Mexico\u201D"}
        className="w-full bg-transparent text-[15px] text-ink-900 placeholder:text-ink-400 outline-none"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="chip hover:bg-ink-50"
          aria-label="Clear search"
        >
          Clear
        </button>
      )}
      <kbd className="hidden md:inline-flex items-center gap-0.5 rounded-md border border-ink-100 bg-ink-50 px-1.5 py-0.5 text-[11px] font-medium text-ink-500">
        ⌘K
      </kbd>
    </div>
  );
}
