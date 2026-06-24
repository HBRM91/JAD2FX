// Anonymous simulation telemetry — NO PII ever sent.
// Logs pair, scenario type, and optional gap_days to Worker KV aggregate.

export type SimScenario =
  | 'FORWARD_QUOTE'
  | 'FORWARD_SAVE'
  | 'SWAP_COMPUTE'
  | 'SWAP_SAVE'
  | 'ROLL_COMPUTE'
  | 'ROLL_SAVE'
  | 'MTM_COMPUTE';

export function logSimTelemetry(
  corsProxyUrl: string,
  pair: string,
  scenario: SimScenario,
  gapDays?: number,
): void {
  if (!corsProxyUrl) return;
  fetch(`${corsProxyUrl}/api/telemetry/sim`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pair, scenario, gapDays }),
  }).catch(() => { /* fire and forget */ });
}
