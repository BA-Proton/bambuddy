import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import type { InventorySpool } from '../../../api/client';
import { api } from '../../../api/client';
import { LinkSpoolModal } from '../../../components/spoolbuddy/LinkSpoolModal';

vi.mock('../../../api/client', () => ({
  api: { getLocations: vi.fn() },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, fallback?: string) => fallback ?? key }),
}));

function spool(id: number, locationId: number, materialNumber: string): InventorySpool {
  return {
    id,
    location_id: locationId,
    material_number: materialNumber,
    material: 'PLA',
    brand: 'Bambu',
    subtype: null,
    color_name: `Colour ${id}`,
    rgba: '000000FF',
    label_weight: 1000,
    weight_used: 0,
  } as unknown as InventorySpool;
}

const SPOOLS = [spool(1, 1, '41'), spool(2, 1, '42'), spool(3, 2, '41')];

function renderModal(onLink = vi.fn()) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    createElement(
      QueryClientProvider,
      { client },
      createElement(LinkSpoolModal, { isOpen: true, onClose: vi.fn(), tagId: 'AABB', untaggedSpools: SPOOLS, onLink }),
    ),
  );
  return onLink;
}

const shownIds = () => screen.queryAllByText(/^#\d+$/).map((el) => el.textContent);

describe('LinkSpoolModal location and Material No. filters', () => {
  beforeEach(() => {
    vi.mocked(api.getLocations).mockResolvedValue([
      { id: 1, name: 'GMS' },
      { id: 2, name: 'PL' },
    ] as never);
  });

  it('lists every untagged spool before filtering', () => {
    renderModal();
    expect(shownIds()).toEqual(['#1', '#2', '#3']);
  });

  it('narrows the list by Material No.', () => {
    renderModal();
    fireEvent.change(screen.getByLabelText('inventory.materialNumber'), { target: { value: '41' } });
    expect(shownIds()).toEqual(['#1', '#3']);
  });

  it('narrows the list by location and Material No. together', async () => {
    renderModal();
    const location = await screen.findByLabelText('inventory.storageLocation');
    fireEvent.change(location, { target: { value: '2' } });
    fireEvent.change(screen.getByLabelText('inventory.materialNumber'), { target: { value: '41' } });
    expect(shownIds()).toEqual(['#3']);
  });

  it('says so when no spool matches', () => {
    renderModal();
    fireEvent.change(screen.getByLabelText('inventory.materialNumber'), { target: { value: '99' } });
    expect(shownIds()).toEqual([]);
    expect(screen.getByText('No results found')).toBeTruthy();
  });

  it('drops a selection the filter hides', () => {
    const onLink = renderModal();
    fireEvent.click(screen.getByText('#2'));
    fireEvent.change(screen.getByLabelText('inventory.materialNumber'), { target: { value: '41' } });
    fireEvent.click(screen.getByText('Link Tag'));
    expect(onLink).not.toHaveBeenCalled();
  });
});
