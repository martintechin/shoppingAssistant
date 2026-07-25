import { useState, useEffect, useCallback, useMemo } from "react";
import { FoodItem, FoodItemsResponse } from "../types/shared";
import { apiRequest } from "../utils/api";
import { REFRESH_INTERVAL } from "../config";

export interface UseFoodItemsResult {
  items: FoodItem[];
  byId: Map<string, FoodItem>;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useFoodItems(): UseFoodItemsResult {
  const [data, setData] = useState<FoodItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiRequest<FoodItemsResponse>("getFoodItems");
      setData(result.items);
    } catch (err) {
      console.error("Failed to fetch food items:", err);
      setError(err instanceof Error ? err.message : "Ett fel uppstod");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
    const intervalId = setInterval(fetchItems, REFRESH_INTERVAL);
    return () => clearInterval(intervalId);
  }, [fetchItems]);

  const items = useMemo(() => data ?? [], [data]);
  const byId = useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);

  return { items, byId, loading, error, refresh: fetchItems };
}
