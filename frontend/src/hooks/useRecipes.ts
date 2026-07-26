import { useState, useEffect, useCallback, useMemo } from "react";
import { Recipe, RecipesResponse } from "../types/shared";
import { apiRequest } from "../utils/api";
import { REFRESH_INTERVAL } from "../config";

export interface UseRecipesResult {
  recipes: Recipe[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useRecipes(): UseRecipesResult {
  const [data, setData] = useState<Recipe[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecipes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiRequest<RecipesResponse>("getRecipes");
      setData(result.recipes);
    } catch (err) {
      console.error("Failed to fetch recipes:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecipes();
    const intervalId = setInterval(fetchRecipes, REFRESH_INTERVAL);
    return () => clearInterval(intervalId);
  }, [fetchRecipes]);

  const recipes = useMemo(() => data ?? [], [data]);

  return { recipes, loading, error, refresh: fetchRecipes };
}
