import type { ChargeLine, TaxLine } from "./db/schema";

/**
 * Money helpers. All amounts are stored as float currency units (rupees).
 * Rounding: round half away from zero to 2dp at the last step of each
 * calculation, so totals always match what the customer saw.
 */

export function round2(n: number): number {
  // Round half away from zero to avoid banker's rounding surprises on .005
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export type PriceBreakdown = {
  subtotal: number; // menu prices incl. any inclusive taxes
  taxTotal: number;
  chargeTotal: number;
  total: number;
  taxLines: { label: string; amount: number }[];
  chargeLines: { label: string; amount: number }[];
};

export function computeTotals(
  subtotal: number,
  taxes: TaxLine[],
  charges: ChargeLine[],
): PriceBreakdown {
  let taxTotal = 0;
  const taxLines: { label: string; amount: number }[] = [];

  for (const tax of taxes) {
    if (tax.isInclusiveOfMenuPrice) {
      // Inclusive tax: back it out of the subtotal for display only.
      const amount = round2(subtotal - subtotal / (1 + tax.rate / 100));
      taxLines.push({ label: `${tax.label} (incl.)`, amount });
    } else {
      const amount = round2((subtotal * tax.rate) / 100);
      taxTotal += amount;
      taxLines.push({ label: tax.label, amount });
    }
  }

  let chargeTotal = 0;
  const chargeLines: { label: string; amount: number }[] = [];
  for (const c of charges) {
    const amount = round2(c.amount);
    chargeTotal += amount;
    chargeLines.push({ label: c.label, amount });
  }

  const total = round2(subtotal + round2(taxTotal) + round2(chargeTotal));
  return {
    subtotal: round2(subtotal),
    taxTotal: round2(taxTotal),
    chargeTotal: round2(chargeTotal),
    total,
    taxLines,
    chargeLines,
  };
}

export function formatMoney(amount: number, symbol = "₹"): string {
  // Indian digit grouping for INR-scale amounts.
  if (symbol === "₹" && amount >= 1000) {
    return `${symbol}${formatIndianNumber(round2(amount))}`;
  }
  return `${symbol}${round2(amount).toLocaleString("en-IN", {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatIndianNumber(n: number): string {
  const [intPart, decPart] = n.toFixed(2).split(".");
  const last3 = intPart.slice(-3);
  const rest = intPart.slice(0, -3);
  const grouped =
    rest.length > 0
      ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + last3
      : last3;
  const dec = decPart === "00" ? "" : `.${decPart}`;
  return `${grouped}${dec}`;
}
