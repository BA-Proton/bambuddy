import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { api } from '../../api/client';
import type { LocationMaterialFilterValue } from '../../utils/inventorySearch';
import { inventoryLocationsQueryKey } from '../../utils/inventoryQueries';

/** Storage-location dropdown and Material No. field for the SpoolBuddy touch screens. */
export function SpoolLocationMaterialFilter({
  value,
  onChange,
}: {
  value: LocationMaterialFilterValue;
  onChange: (value: LocationMaterialFilterValue) => void;
}) {
  const { t } = useTranslation();
  const { data: locationsData } = useQuery({
    queryKey: inventoryLocationsQueryKey,
    queryFn: api.getLocations,
  });
  const locations = locationsData ?? [];

  return (
    <div className="flex gap-2">
      {locations.length > 0 && (
        <select
          value={value.locationId}
          onChange={(e) => onChange({ ...value, locationId: e.target.value })}
          aria-label={t('inventory.storageLocation')}
          className={`shrink-0 px-3 py-2 rounded-lg border text-sm transition-colors focus:outline-none ${
            value.locationId
              ? 'bg-bambu-green/20 text-bambu-green border-bambu-green/30'
              : 'bg-bambu-dark-secondary text-white/70 border-bambu-dark-tertiary'
          }`}
        >
          <option value="">{t('inventory.storageLocation')}</option>
          {locations.map((loc) => (
            <option key={loc.id} value={String(loc.id)}>{loc.name}</option>
          ))}
        </select>
      )}
      <div className="relative flex-1 min-w-0">
        <input
          type="text"
          value={value.materialNumbers}
          onChange={(e) => onChange({ ...value, materialNumbers: e.target.value })}
          placeholder={t('inventory.materialNumber')}
          aria-label={t('inventory.materialNumber')}
          autoCapitalize="characters"
          className="w-full pl-3 pr-8 py-2 bg-bambu-dark-secondary border border-bambu-dark-tertiary rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:border-bambu-green"
        />
        {value.materialNumbers && (
          <button
            onClick={() => onChange({ ...value, materialNumbers: '' })}
            aria-label={t('common.clear', 'Clear')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
