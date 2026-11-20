import { useEffect } from 'react';
import type { SpoolFormData } from '../components/spool-form/types';
import { brandCoreWeight } from '../utils/weight';

/**
 * Keeps a new spool's empty weight on its brand's default while the user has
 * not set one: the catalog entry marked for that brand, else `fallback`.
 */
export function useBrandCoreWeightDefault({
  enabled,
  brand,
  catalog,
  fallback,
  setFormData,
}: {
  enabled: boolean;
  brand: string;
  catalog: { id: number; weight: number; brand?: string | null }[];
  fallback: number;
  setFormData: (update: (prev: SpoolFormData) => SpoolFormData) => void;
}) {
  useEffect(() => {
    if (!enabled) return;
    const next = brandCoreWeight(catalog, brand, fallback);
    setFormData((prev) =>
      prev.core_weight === next.core_weight && prev.core_weight_catalog_id === next.core_weight_catalog_id
        ? prev
        : { ...prev, ...next },
    );
  }, [enabled, brand, catalog, fallback, setFormData]);
}
