/**
 * P3.21 — A/B testing infrastructure.
 * Assigns a user to a variant (sticky per browser) and exposes a hook to track
 * conversions. Variants are configured per experiment in localStorage; admins
 * can set them via admin panel (P3.21 admin tab).
 *
 * Default variants use a 50/50 split via hash of userId (random UUID in localStorage).
 * Conversion events are dispatched to Plausible.
 */

const STORAGE_KEY = 'jad2fx_experiments_v1';
const USERID_KEY = 'jad2fx_user_id';

export interface ExperimentVariant {
  experiment: string;
  variant: string;
  assignedAt: number;
}

function getOrCreateUserId(): string {
  try {
    let id = localStorage.getItem(USERID_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(USERID_KEY, id);
    }
    return id;
  } catch { return 'anonymous'; }
}

function hashUserToVariant(userId: string, experiment: string, salt: string): number {
  // Simple deterministic hash → 0..1
  const combined = `${userId}:${experiment}:${salt}`;
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    hash = (hash << 5) - hash + combined.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) / 2_147_483_647;
}

export function getOrAssignVariant(
  experiment: string,
  variants: string[],
  salt: string = '',
): string {
  if (variants.length === 0) return 'control';
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const map: Record<string, ExperimentVariant> = raw ? JSON.parse(raw) : {};
    if (map[experiment]) return map[experiment].variant;
    const userId = getOrCreateUserId();
    const idx = Math.floor(hashUserToVariant(userId, experiment, salt) * variants.length);
    const variant = variants[idx] || variants[0];
    map[experiment] = { experiment, variant, assignedAt: Date.now() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
    return variant;
  } catch { return variants[0]; }
}

export function trackExposure(experiment: string, variant: string) {
  if (typeof window !== 'undefined' && (window as any).plausible) {
    (window as any).plausible('exp_exposure', { props: { experiment, variant } });
  }
}

export function trackConversion(experiment: string, variant: string, goal: string = 'primary') {
  if (typeof window !== 'undefined' && (window as any).plausible) {
    (window as any).plausible('exp_conversion', { props: { experiment, variant, goal } });
  }
}

/**
 * React hook: returns the variant for an experiment, tracks exposure once.
 */
import { useEffect, useState } from 'react';

export function useExperiment(
  experiment: string,
  variants: string[],
  salt: string = '',
): string {
  const [variant, setVariant] = useState<string>(() =>
    typeof window === 'undefined' ? variants[0] : getOrAssignVariant(experiment, variants, salt),
  );
  useEffect(() => {
    const v = getOrAssignVariant(experiment, variants, salt);
    setVariant(v);
    trackExposure(experiment, v);
  }, [experiment, salt, variants.join(',')]);
  return variant;
}
