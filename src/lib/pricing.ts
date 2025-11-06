export interface PricingInput {
  quantity: number;
  tshirtPrice?: number; // per unit
  printPrice?: number; // per unit
  gstRate?: number; // e.g., 0.05 for 5%
}

export interface PricingBreakdown {
  perItemSubtotal: number;
  perItemGst: number;
  perItemTotal: number;
  subtotal: number;
  gst: number;
  total: number;
}

export function calculatePricing({
  quantity,
  tshirtPrice = 299,
  printPrice = 99,
  gstRate = 0.05,
}: PricingInput): PricingBreakdown {
  const perItemSubtotal = tshirtPrice + printPrice;
  const perItemGst = Math.round(perItemSubtotal * gstRate);
  const perItemTotal = perItemSubtotal + perItemGst;

  const subtotal = perItemSubtotal * quantity;
  const gst = perItemGst * quantity;
  const total = subtotal + gst;

  return { perItemSubtotal, perItemGst, perItemTotal, subtotal, gst, total };
}


