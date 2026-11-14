"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/**
 * Cart state for one table session. Keys are foodItemId + sorted optionIds
 * so identical configurations merge and different ones stack separately.
 * Persisted to sessionStorage (per-tab, survives reload, dies with tab —
 * appropriate for a single table session).
 */

export type CartSelection = {
  optionId: string;
  groupLabel: string;
  optionLabel: string;
  priceDelta: number;
};

export type CartLine = {
  key: string;
  foodItemId: string;
  name: string;
  basePrice: number;
  imageId: string | null;
  isVeg: boolean;
  selections: CartSelection[];
  quantity: number;
  notes?: string;
};

type CartContextValue = {
  lines: CartLine[];
  count: number;
  subtotal: number;
  addLine: (line: Omit<CartLine, "key">) => void;
  setQuantity: (key: string, q: number) => void;
  removeLine: (key: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function lineKey(foodItemId: string, selections: CartSelection[], notes?: string) {
  const optPart = selections
    .map((s) => s.optionId)
    .sort()
    .join("|");
  return `${foodItemId}__${optPart}__${notes ?? ""}`;
}

export function lineUnitPrice(line: Pick<CartLine, "basePrice" | "selections">) {
  return (
    Math.round(
      (line.basePrice +
        line.selections.reduce((s, sel) => s + sel.priceDelta, 0)) *
        100,
    ) / 100
  );
}

export function CartProvider({
  children,
  token,
}: {
  children: ReactNode;
  token: string;
}) {
  const storageKey = `cart_${token}`;
  const [lines, setLines] = useState<CartLine[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(sessionStorage.getItem(storageKey) ?? "[]") as CartLine[];
    } catch {
      return [];
    }
  });

  const persist = useCallback(
    (next: CartLine[]) => {
      setLines(next);
      try {
        sessionStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        /* private mode — cart lives in memory only */
      }
    },
    [storageKey],
  );

  const addLine = useCallback(
    (line: Omit<CartLine, "key">) => {
      const key = lineKey(line.foodItemId, line.selections, line.notes);
      persist((() => {
        const existing = lines.find((l) => l.key === key);
        if (existing) {
          return lines.map((l) =>
            l.key === key ? { ...l, quantity: Math.min(50, l.quantity + line.quantity) } : l,
          );
        }
        return [...lines, { ...line, key }];
      })());
    },
    [lines, persist],
  );

  const setQuantity = useCallback(
    (key: string, q: number) => {
      if (q <= 0) {
        persist(lines.filter((l) => l.key !== key));
      } else {
        persist(
          lines.map((l) => (l.key === key ? { ...l, quantity: Math.min(50, q) } : l)),
        );
      }
    },
    [lines, persist],
  );

  const removeLine = useCallback(
    (key: string) => persist(lines.filter((l) => l.key !== key)),
    [lines, persist],
  );

  const clear = useCallback(() => persist([]), [persist]);

  const value = useMemo<CartContextValue>(() => {
    const count = lines.reduce((s, l) => s + l.quantity, 0);
    const subtotal =
      Math.round(
        lines.reduce(
          (s, l) => s + lineUnitPrice(l) * l.quantity,
          0,
        ) * 100,
      ) / 100;
    return { lines, count, subtotal, addLine, setQuantity, removeLine, clear };
  }, [lines, addLine, setQuantity, removeLine, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
