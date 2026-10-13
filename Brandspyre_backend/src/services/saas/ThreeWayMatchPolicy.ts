export interface ThreeWayMatchResult {
  status: 'EXACT_MATCH' | 'QUANTITY_VARIANCE' | 'PRICE_VARIANCE' | 'TOLERANCE_EXCEEDED';
  isPassed: boolean;
  quantityVariance: number;
  priceVariance: number;
  amountVariance: number;
  details: string[];
}

export interface MatchPolicyConfig {
  quantityTolerancePercent?: number; // e.g., 2%
  priceTolerancePercent?: number;    // e.g., 1.5%
  amountToleranceValue?: number;     // e.g., ₹50
}

export class ThreeWayMatchPolicy {
  /**
   * Validate 3-way match across Purchase Order, Goods Receipt Note (GRN), and Vendor Bill
   */
  static evaluateMatch(
    poItems: { productId: string; unitCost: number; orderedQuantity: number }[],
    grnItems: { productId: string; receivedQuantity: number }[],
    billItems: { productId: string; billedUnitCost: number; billedQuantity: number }[],
    config: MatchPolicyConfig = { quantityTolerancePercent: 2, priceTolerancePercent: 1.5, amountToleranceValue: 50 }
  ): ThreeWayMatchResult {
    const details: string[] = [];
    let isPassed = true;
    let maxQtyVar = 0;
    let maxPriceVar = 0;
    let maxAmtVar = 0;

    const poMap = new Map(poItems.map(i => [i.productId, i]));
    const grnMap = new Map(grnItems.map(i => [i.productId, i.receivedQuantity]));

    for (const billItem of billItems) {
      const poItem = poMap.get(billItem.productId);
      const receivedQty = grnMap.get(billItem.productId) || 0;

      if (!poItem) {
        details.push(`Billed product ${billItem.productId} was not found in Purchase Order.`);
        isPassed = false;
        continue;
      }

      // 1. Quantity Matching (Billed vs GRN Received)
      const qtyDiff = Math.abs(billItem.billedQuantity - receivedQty);
      const qtyVarPct = receivedQty > 0 ? (qtyDiff / receivedQty) * 100 : (billItem.billedQuantity > 0 ? 100 : 0);
      maxQtyVar = Math.max(maxQtyVar, qtyVarPct);

      if (qtyVarPct > (config.quantityTolerancePercent || 0)) {
        details.push(`Quantity Variance for product ${poItem.productId}: Billed (${billItem.billedQuantity}) vs Received (${receivedQty}) exceeds tolerance of ${config.quantityTolerancePercent}%.`);
        isPassed = false;
      }

      // 2. Price Matching (Billed Unit Cost vs PO Unit Cost)
      const priceDiff = Math.abs(billItem.billedUnitCost - poItem.unitCost);
      const priceVarPct = poItem.unitCost > 0 ? (priceDiff / poItem.unitCost) * 100 : 0;
      maxPriceVar = Math.max(maxPriceVar, priceVarPct);

      if (priceVarPct > (config.priceTolerancePercent || 0)) {
        details.push(`Price Variance for product ${poItem.productId}: Billed Cost (₹${billItem.billedUnitCost}) vs PO Cost (₹${poItem.unitCost}) exceeds tolerance of ${config.priceTolerancePercent}%.`);
        isPassed = false;
      }

      // 3. Line Amount Variance
      const poLineTotal = poItem.orderedQuantity * poItem.unitCost;
      const billLineTotal = billItem.billedQuantity * billItem.billedUnitCost;
      const amtDiff = Math.abs(billLineTotal - poLineTotal);
      maxAmtVar = Math.max(maxAmtVar, amtDiff);
    }

    let status: ThreeWayMatchResult['status'] = 'EXACT_MATCH';
    if (!isPassed) {
      status = maxPriceVar > (config.priceTolerancePercent || 0) ? 'PRICE_VARIANCE' : 'QUANTITY_VARIANCE';
    }

    return {
      status,
      isPassed,
      quantityVariance: Math.round(maxQtyVar * 100) / 100,
      priceVariance: Math.round(maxPriceVar * 100) / 100,
      amountVariance: Math.round(maxAmtVar * 100) / 100,
      details: details.length > 0 ? details : ['3-Way Match validation succeeded within tolerances.']
    };
  }
}

export default ThreeWayMatchPolicy;
