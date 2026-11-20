// Empty-spool weight assumed when a spool has no core weight of its own
// (typical Bambu spool core).
export const DEFAULT_CORE_WEIGHT_G = 250;

/**
 * The empty spool weight a new spool of `brand` starts with: the catalog entry
 * set as that brand's default, else `fallback` with no catalog link.
 */
export function brandCoreWeight(
  catalog: { id: number; weight: number; brand?: string | null }[],
  brand: string | null | undefined,
  fallback: number,
): { core_weight: number; core_weight_catalog_id: number | null } {
  const key = brand?.trim().toLowerCase();
  const entry = key ? catalog.find((e) => e.brand?.trim().toLowerCase() === key) : undefined;
  return entry
    ? { core_weight: entry.weight, core_weight_catalog_id: entry.id }
    : { core_weight: fallback, core_weight_catalog_id: null };
}

export function formatWeight(grams: number): string {
  if (grams >= 1_000_000) {
    const tonnes = grams / 1_000_000;
    return `${tonnes % 1 === 0 ? tonnes.toFixed(0) : tonnes.toFixed(1)}t`;
  }
  if (grams >= 1000) {
    const kg = grams / 1000;
    return `${kg % 1 === 0 ? kg.toFixed(0) : kg.toFixed(1)}kg`;
  }
  return `${Math.round(grams)}g`;
}
