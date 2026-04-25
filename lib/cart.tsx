"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { BundleKey, CoverageEntry } from "./types";

// We only support selecting regulators in the cart (those are what drive
// Regulatory Content pricing). Rulebooks + exchanges are toggled as flat
// bundles on the pricing page instead.
export interface CartRegulator {
  id: string;
  name: string;
  country: string;
  iso3: string | null;
  level?: "federal" | "state" | null;
  jurisdiction: string;
}

interface CartState {
  regulators: Record<string, CartRegulator>;
  bundles: Record<BundleKey, boolean>;
}

interface CartContextValue extends CartState {
  /** Number of selected regulators — hydration-safe (returns 0 on SSR). */
  count: number;
  has: (id: string) => boolean;
  add: (entry: CoverageEntry) => void;
  remove: (id: string) => void;
  toggle: (entry: CoverageEntry) => void;
  addMany: (entries: CoverageEntry[]) => void;
  clear: () => void;
  setBundle: (key: BundleKey, on: boolean) => void;
  hydrated: boolean;
}

const EMPTY: CartState = {
  regulators: {},
  bundles: { rulebooks: false, exchanges: false },
};

const STORAGE_KEY = "sai360-cart-v1";

const CartContext = createContext<CartContextValue | null>(null);

/** Stable ID for a regulator entry, derived from country + name. */
export function entryId(e: CoverageEntry): string {
  return `${e.tier}|${e.iso3 ?? e.country}|${e.name}`;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<CartState>(EMPTY);
  const [hydrated, setHydrated] = useState(false);
  const skipNextPersist = useRef(true);

  // Load from localStorage on mount.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<CartState>;
        setState({
          regulators: parsed.regulators ?? {},
          bundles: {
            rulebooks: parsed.bundles?.rulebooks ?? false,
            exchanges: parsed.bundles?.exchanges ?? false,
          },
        });
      }
    } catch {
      // If the blob is corrupt, just start empty.
    }
    setHydrated(true);
  }, []);

  // Persist on change (skipping the first run after hydration to avoid
  // writing the default empty state back over a real stored value).
  useEffect(() => {
    if (!hydrated) return;
    if (skipNextPersist.current) {
      skipNextPersist.current = false;
      return;
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage disabled / quota: silently ignore. Cart still works in-memory.
    }
  }, [state, hydrated]);

  const add = useCallback((entry: CoverageEntry) => {
    if (entry.tier !== "regulators") return;
    const id = entryId(entry);
    setState((s) =>
      s.regulators[id]
        ? s
        : {
            ...s,
            regulators: {
              ...s.regulators,
              [id]: {
                id,
                name: entry.name,
                country: entry.country,
                iso3: entry.iso3,
                level: entry.level ?? null,
                jurisdiction: entry.jurisdiction,
              },
            },
          }
    );
  }, []);

  const remove = useCallback((id: string) => {
    setState((s) => {
      if (!s.regulators[id]) return s;
      const next = { ...s.regulators };
      delete next[id];
      return { ...s, regulators: next };
    });
  }, []);

  const toggle = useCallback(
    (entry: CoverageEntry) => {
      if (entry.tier !== "regulators") return;
      const id = entryId(entry);
      setState((s) => {
        if (s.regulators[id]) {
          const next = { ...s.regulators };
          delete next[id];
          return { ...s, regulators: next };
        }
        return {
          ...s,
          regulators: {
            ...s.regulators,
            [id]: {
              id,
              name: entry.name,
              country: entry.country,
              iso3: entry.iso3,
              level: entry.level ?? null,
              jurisdiction: entry.jurisdiction,
            },
          },
        };
      });
    },
    []
  );

  const addMany = useCallback((entries: CoverageEntry[]) => {
    setState((s) => {
      const next = { ...s.regulators };
      for (const e of entries) {
        if (e.tier !== "regulators") continue;
        const id = entryId(e);
        if (!next[id]) {
          next[id] = {
            id,
            name: e.name,
            country: e.country,
            iso3: e.iso3,
            level: e.level ?? null,
            jurisdiction: e.jurisdiction,
          };
        }
      }
      return { ...s, regulators: next };
    });
  }, []);

  const clear = useCallback(() => {
    setState(EMPTY);
  }, []);

  const setBundle = useCallback((key: BundleKey, on: boolean) => {
    setState((s) => ({ ...s, bundles: { ...s.bundles, [key]: on } }));
  }, []);

  const has = useCallback(
    (id: string) => !!state.regulators[id],
    [state.regulators]
  );

  const value = useMemo<CartContextValue>(
    () => ({
      ...state,
      count: hydrated ? Object.keys(state.regulators).length : 0,
      has,
      add,
      remove,
      toggle,
      addMany,
      clear,
      setBundle,
      hydrated,
    }),
    [state, hydrated, has, add, remove, toggle, addMany, clear, setBundle]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
