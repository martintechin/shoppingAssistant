import { useState, useEffect, useCallback, useMemo } from "react";
import { Store, StoresResponse } from "../types/shared";
import { apiRequest } from "../utils/api";
import { REFRESH_INTERVAL } from "../config";

export interface UseStoresResult {
  stores: Store[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useStores(): UseStoresResult {
  const [data, setData] = useState<Store[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStores = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiRequest<StoresResponse>("getStores");
      setData(result.stores);
    } catch (err) {
      console.error("Failed to fetch stores:", err);
      setError(err instanceof Error ? err.message : "Ett fel uppstod");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStores();
    const intervalId = setInterval(fetchStores, REFRESH_INTERVAL);
    return () => clearInterval(intervalId);
  }, [fetchStores]);

  const stores = useMemo(() => data ?? [], [data]);

  return { stores, loading, error, refresh: fetchStores };
}
