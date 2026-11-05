const currency = process.env.NEXT_PUBLIC_CURRENCY || "LKR";

const formatter = new Intl.NumberFormat("en", {
  style: "currency",
  currency,
  maximumFractionDigits: 0,
});

export const money = (amount: number) => formatter.format(amount);

/** Household pays this on top of the quote to get a Protected Job. A starting value to test. */
export const PROTECTION_RATE = 0.05;
export const protectionFee = (quote: number) => Math.max(1, Math.round(quote * PROTECTION_RATE));
