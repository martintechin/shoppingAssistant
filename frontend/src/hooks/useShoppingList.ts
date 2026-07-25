import { useState, useEffect, useCallback, useMemo } from "react";
import { ListItem, ListResponse } from "../types/shared";
import { apiRequest } from "../utils/api";
import { REFRESH_INTERVAL } from "../config";

export interface UseShoppingListResult {
  items: ListItem[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  /** Optimistic local update; the next poll or refresh reconciles with the server. */
  mutate: (updater: (items: ListItem[]) => ListItem[]) => void;
}

export function useShoppingList(): UseShoppingListResult {
  const [data, setData] = useState<ListItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchList = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiRequest<ListResponse>("getList");
      setData(result.items);
    } catch (err) {
      console.error("Failed to fetch shopping list:", err);
      setError(err instanceof Error ? err.message : "Ett fel uppstod");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList();
    const intervalId = setInterval(fetchList, REFRESH_INTERVAL);
    return () => clearInterval(intervalId);
  }, [fetchList]);

  const mutate = useCallback((updater: (items: ListItem[]) => ListItem[]) => {
    setData((current) => (current ? updater(current) : current));
  }, []);

  const items = useMemo(() => data ?? [], [data]);

  return { items, loading, error, refresh: fetchList, mutate };
}
