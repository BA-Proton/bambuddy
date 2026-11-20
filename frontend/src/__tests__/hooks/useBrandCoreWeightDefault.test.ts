import { describe, it, expect } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useState } from 'react';
import { useBrandCoreWeightDefault } from '../../hooks/useBrandCoreWeightDefault';
import { defaultFormData, type SpoolFormData } from '../../components/spool-form/types';
import { brandCoreWeight } from '../../utils/weight';

const catalog = [
  { id: 92, weight: 203, brand: 'SUNLU' },
  { id: 24, weight: 250, brand: null },
  { id: 93, weight: 140, brand: ' Elegoo ' },
];

describe('brandCoreWeight', () => {
  it("returns the brand's catalog entry, matching case and spaces loosely", () => {
    expect(brandCoreWeight(catalog, ' sunlu', 280)).toEqual({ core_weight: 203, core_weight_catalog_id: 92 });
    expect(brandCoreWeight(catalog, 'ELEGOO', 280)).toEqual({ core_weight: 140, core_weight_catalog_id: 93 });
  });

  it('falls back unlinked for an unknown or blank brand, never to a weight match', () => {
    expect(brandCoreWeight(catalog, 'Ziro', 250)).toEqual({ core_weight: 250, core_weight_catalog_id: null });
    expect(brandCoreWeight(catalog, '', 280)).toEqual({ core_weight: 280, core_weight_catalog_id: null });
    expect(brandCoreWeight(catalog, null, 280)).toEqual({ core_weight: 280, core_weight_catalog_id: null });
  });
});

function setup(enabled: boolean, fallback = 280) {
  return renderHook(
    ({ brand }) => {
      const [formData, setFormData] = useState<SpoolFormData>(defaultFormData);
      useBrandCoreWeightDefault({ enabled, brand, catalog, fallback, setFormData });
      return formData;
    },
    { initialProps: { brand: '' } },
  );
}

describe('useBrandCoreWeightDefault', () => {
  it('follows the brand while enabled', () => {
    const { result, rerender } = setup(true);
    expect(result.current.core_weight).toBe(280);
    expect(result.current.core_weight_catalog_id).toBeNull();

    act(() => rerender({ brand: 'SUNLU' }));
    expect(result.current.core_weight).toBe(203);
    expect(result.current.core_weight_catalog_id).toBe(92);

    act(() => rerender({ brand: 'Ziro' }));
    expect(result.current.core_weight).toBe(280);
    expect(result.current.core_weight_catalog_id).toBeNull();
  });

  it('leaves the form alone when disabled', () => {
    const { result, rerender } = setup(false);
    act(() => rerender({ brand: 'SUNLU' }));
    expect(result.current.core_weight).toBe(defaultFormData.core_weight);
    expect(result.current.core_weight_catalog_id).toBe(defaultFormData.core_weight_catalog_id);
  });
});
