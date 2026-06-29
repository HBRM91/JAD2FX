/**
 * P1.20 — Invariant guard for bid/ask pricing.
 * Ensures the data invariant: ask > mid > bid > 0.
 * If violated, logs to console and clamps to a safe default.
 */

export interface InvariantResult {
  ok: boolean;
  reason: string | null;
  clamped?: { bid: number; mid: number; ask: number };
}

/**
 * Verify the bid < mid < ask invariant for a price triple.
 * If violated, returns clamped values that respect the order.
 */
export function verifyBidAskInvariant(
  bid: number,
  mid: number,
  ask: number,
): InvariantResult {
  if (!Number.isFinite(bid) || !Number.isFinite(mid) || !Number.isFinite(ask)) {
    return { ok: false, reason: 'Non-finite price', clamped: { bid: 0, mid: 0, ask: 0 } };
  }
  if (mid <= 0) {
    return { ok: false, reason: 'Mid must be > 0', clamped: { bid: 0, mid: 0, ask: 0 } };
  }
  if (ask <= mid) {
    // Clamp: preserve mid, set ask = mid × 1.001, bid = mid × 0.999
    const clampedAsk = +(mid * 1.001).toFixed(6);
    return { ok: false, reason: `ask (${ask}) ≤ mid (${mid})`, clamped: { bid: mid * 0.999, mid, ask: clampedAsk } };
  }
  if (bid >= mid) {
    const clampedBid = +(mid * 0.999).toFixed(6);
    return { ok: false, reason: `bid (${bid}) ≥ mid (${mid})`, clamped: { bid: clampedBid, mid, ask: mid * 1.001 } };
  }
  if (ask <= bid) {
    return { ok: false, reason: `ask (${ask}) ≤ bid (${bid})`, clamped: { bid, mid, ask: mid * 1.001 } };
  }
  return { ok: true, reason: null };
}

/**
 * Asserts the invariant and logs a console warning on failure.
 * Returns the (possibly clamped) safe values.
 */
export function assertBidAskInvariant(
  bid: number,
  mid: number,
  ask: number,
  context: string = '',
): { bid: number; mid: number; ask: number } {
  const r = verifyBidAskInvariant(bid, mid, ask);
  if (!r.ok) {
    if (typeof console !== 'undefined') {
      console.warn(
        `[Pricing] bid/ask invariant violation${context ? ` (${context})` : ''}: ${r.reason}. ` +
        `Clamped to safe values.`,
      );
    }
    return r.clamped ?? { bid, mid, ask };
  }
  return { bid, mid, ask };
}
