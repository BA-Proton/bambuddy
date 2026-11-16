import { describe, it, expect } from 'vitest';
import {
  applyLocationMaterialFilter,
  emptyLocationMaterialFilter,
  isLocationMaterialFilterActive,
} from '../../utils/inventorySearch';
import type { InventorySpool } from '../../api/client';

const spool = (id: number, location_id: number | null, material_number: string | null) =>
  ({ id, location_id, material_number }) as InventorySpool;

const spools = [spool(1, 1, '27'), spool(2, 1, 'G2'), spool(3, 2, 'G2'), spool(4, 2, '127'), spool(5, null, null)];

describe('applyLocationMaterialFilter', () => {
  it('returns every spool when empty', () => {
    expect(applyLocationMaterialFilter(spools, emptyLocationMaterialFilter)).toHaveLength(5);
    expect(isLocationMaterialFilterActive(emptyLocationMaterialFilter)).toBe(false);
  });

  it('filters by location only', () => {
    expect(applyLocationMaterialFilter(spools, { locationId: '2', materialNumbers: '' }).map((s) => s.id)).toEqual([3, 4]);
  });

  it('combines location and material numbers', () => {
    const value = { locationId: '1', materialNumbers: 'g2, 127' };
    expect(isLocationMaterialFilterActive(value)).toBe(true);
    expect(applyLocationMaterialFilter(spools, value).map((s) => s.id)).toEqual([2]);
  });
});
