import { useState, FormEvent } from "react";
import { FoodItem, Recipe, RecipeIngredient, StoreFoodItemResponse } from "../types/shared";
import { UseFoodItemsResult } from "../hooks/useFoodItems";
import { filterAndRank, normalize } from "../utils/text";
import { getCategoryColor, getDefaultQuantity, stepQuantity, getAllCategories } from "../config";
import { apiPost, apiPut, ApiError } from "../utils/api";
import { t } from "../i18n";
import { Modal } from "./Modal";
import { NewFoodItemModal } from "./NewFoodItemModal";
import { EditableQuantity } from "./EditableQuantity";

interface RecipeFormProps {
  recipe?: Recipe;
  foodItems: UseFoodItemsResult;
  onSave: () => void;
  onClose: () => void;
}

interface IngredientRow {
  foodItemId: string;
  quantity: number;
}

export function RecipeForm({ recipe, foodItems, onSave, onClose }: RecipeFormProps) {
  const [name, setName] = useState(recipe?.name ?? "");
  const [ingredients, setIngredients] = useState<IngredientRow[]>(
    recipe?.ingredients ?? []
  );
  const [query, setQuery] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createFoodName, setCreateFoodName] = useState<string | null>(null);

  const categories = getAllCategories(foodItems.items.map((i) => i.category));
  const ingredientIds = new Set(ingredients.map((i) => i.foodItemId));

  const trimmedQuery = query.trim();
  const available = foodItems.items.filter((i) => !ingredientIds.has(i.id));
  const suggestions = filterAndRank(available, trimmedQuery, (i) => i.name);
  const hasExactMatch = suggestions.some(
    (i) => normalize(i.name) === normalize(trimmedQuery)
  );

  function addIngredient(foodItem: FoodItem) {
    setIngredients((prev) => [
      ...prev,
      { foodItemId: foodItem.id, quantity: getDefaultQuantity(foodItem.unit) },
    ]);
    setQuery("");
  }

  function removeIngredient(foodItemId: string) {
    setIngredients((prev) => prev.filter((i) => i.foodItemId !== foodItemId));
  }

  function updateQuantity(foodItemId: string, quantity: number) {
    setIngredients((prev) =>
      prev.map((i) => (i.foodItemId === foodItemId ? { ...i, quantity } : i))
    );
  }

  async function handleCreateFood(foodName: string, category: string, unit: string) {
    try {
      const result = await apiPost<StoreFoodItemResponse>("storeFoodItem", {
        name: foodName,
        category,
        unit,
      });
      foodItems.refresh();
      addIngredient(result.item);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409 && err.data?.existingId) {
        const existing = foodItems.byId.get(err.data.existingId);
        if (existing) addIngredient(existing);
        foodItems.refresh();
      } else {
        throw err;
      }
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError(t("recipeForm.emptyName"));
      return;
    }
    if (ingredients.length === 0) {
      setError(t("recipeForm.noIngredients"));
      return;
    }

    setSubmitting(true);
    try {
      const payload: { name: string; ingredients: RecipeIngredient[] } = {
        name: trimmedName,
        ingredients,
      };
      if (recipe) {
        await apiPut("updateRecipe", { id: recipe.id, ...payload });
      } else {
        await apiPost("storeRecipe", payload);
      }
      onSave();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("recipeForm.saveFailed"));
      setSubmitting(false);
    }
  }

  return (
    <Modal
      title={recipe ? t("recipeForm.editTitle") : t("recipeForm.newTitle")}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit}>
        <div className="form-field">
          <label htmlFor="recipe-name">{t("recipeForm.name")}</label>
          <input
            id="recipe-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("recipeForm.namePlaceholder")}
            autoComplete="off"
            autoFocus
          />
        </div>

        <div className="form-field">
          <label>{t("recipeForm.ingredients")}</label>

          {ingredients.length > 0 && (
            <div className="recipe-ingredients-list">
              {ingredients.map((ing) => {
                const food = foodItems.byId.get(ing.foodItemId);
                return (
                  <div key={ing.foodItemId} className="recipe-ingredient-row">
                    <span className="recipe-ingredient-name">
                      {food?.name ?? t("recipeDetail.removedItem")}
                    </span>
                    <div className="quantity-stepper">
                      <button
                        type="button"
                        className="stepper-btn"
                        disabled={ing.quantity <= 0.25}
                        onClick={() => updateQuantity(ing.foodItemId, food ? stepQuantity(food.unit, ing.quantity, "down") : Math.max(1, ing.quantity - 1))}
                        aria-label={t("listItem.decrease")}
                      >
                        −
                      </button>
                      <EditableQuantity
                        quantity={ing.quantity}
                        unit={food?.unit ?? ""}
                        onChange={(v) => updateQuantity(ing.foodItemId, v)}
                      />
                      <button
                        type="button"
                        className="stepper-btn"
                        onClick={() => updateQuantity(ing.foodItemId, food ? stepQuantity(food.unit, ing.quantity, "up") : ing.quantity + 1)}
                        aria-label={t("listItem.increase")}
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      className="btn-icon btn-remove"
                      onClick={() => removeIngredient(ing.foodItemId)}
                      aria-label={t("listItem.remove", { name: food?.name ?? "" })}
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <div className="recipe-add-ingredient">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("recipeForm.addIngredient")}
              autoComplete="off"
              onKeyDown={(e) => {
                if (e.key === "Enter" && trimmedQuery) {
                  e.preventDefault();
                  if (suggestions.length > 0) {
                    addIngredient(suggestions[0]);
                  } else if (!hasExactMatch) {
                    setCreateFoodName(trimmedQuery);
                    setQuery("");
                  }
                }
              }}
            />
            {trimmedQuery && (
              <div className="suggestions">
                {suggestions.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="suggestion"
                    onClick={() => addIngredient(item)}
                  >
                    <span className="suggestion-name">{item.name}</span>
                    <span
                      className="category-chip"
                      style={{ backgroundColor: getCategoryColor(item.category) }}
                    >
                      {item.category}
                    </span>
                  </button>
                ))}
                {!hasExactMatch && (
                  <button
                    type="button"
                    className="suggestion suggestion-create"
                    onClick={() => {
                      setCreateFoodName(trimmedQuery);
                      setQuery("");
                    }}
                  >
                    {t("addItem.create", { name: trimmedQuery })}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {error && <div className="form-error">{error}</div>}

        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>
            {t("recipeForm.cancel")}
          </button>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? t("recipeForm.saving") : t("recipeForm.save")}
          </button>
        </div>
      </form>

      {createFoodName !== null && (
        <NewFoodItemModal
          initialName={createFoodName}
          categories={categories}
          onClose={() => setCreateFoodName(null)}
          onCreate={handleCreateFood}
        />
      )}
    </Modal>
  );
}
