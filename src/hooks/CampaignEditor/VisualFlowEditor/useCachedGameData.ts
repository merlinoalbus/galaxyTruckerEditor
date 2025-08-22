import { useEffect, useState } from 'react';
import { variablesSystemApiService } from '@/services/CampaignEditor/VariablesSystem/variablesSystemApiService';
import { gameDataService } from '@/services/CampaignEditor/GameDataService';

let ACH_CACHE: string[] | null = null;
let SHIPPLANS_CACHE: Array<{ id: string; type: string | null; file?: string }> | null = null;
let ACH_LOADING = false;
let SHIP_LOADING = false;

export function useCachedAchievements() {
  const [data, setData] = useState<string[] | null>(ACH_CACHE);

  useEffect(() => {
    let mounted = true;
    if (!ACH_CACHE && !ACH_LOADING) {
      ACH_LOADING = true;
      variablesSystemApiService.loadAchievements()
        .then(arr => {
          ACH_CACHE = (arr || []).map(a => a.name);
          if (mounted) setData(ACH_CACHE);
        })
        .finally(() => { ACH_LOADING = false; });
    }
    return () => { mounted = false; };
  }, []);

  return data || [];
}

export function useCachedShipPlans() {
  const [data, setData] = useState<typeof SHIPPLANS_CACHE>(SHIPPLANS_CACHE);

  useEffect(() => {
    let mounted = true;
    if (!SHIPPLANS_CACHE && !SHIP_LOADING) {
      SHIP_LOADING = true;
      gameDataService.getShipPlans()
        .then(list => {
          SHIPPLANS_CACHE = list || [];
          if (mounted) setData(SHIPPLANS_CACHE);
        })
        .finally(() => { SHIP_LOADING = false; });
    }
    return () => { mounted = false; };
  }, []);

  return data || [];
}
