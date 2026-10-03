import type { SilverCoinTier } from '@/lib/types';

/**
 * Pick the active tier's `coins` cap for a given sales count.
 * Tiers are ordered by `upTo` ascending; `upTo: null` is the final open tier.
 * Returns 0 if no tier matches (empty config).
 */
export function resolveSilverCoinCap(
  tiers: SilverCoinTier[],
  salesCount: number,
): number {
  const sorted = sortTiers(tiers);
  for (const tier of sorted) {
    if (tier.upTo === null || salesCount <= tier.upTo) return tier.coins;
  }
  return 0;
}

/** Ascending by `upTo`; `null` sinks to the end. */
export function sortTiers(tiers: SilverCoinTier[]): SilverCoinTier[] {
  return [...tiers].sort((a, b) => {
    if (a.upTo === null) return 1;
    if (b.upTo === null) return -1;
    return a.upTo - b.upTo;
  });
}
