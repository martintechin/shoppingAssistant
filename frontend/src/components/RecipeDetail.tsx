import { useState } from "react";
import { Recipe, AddListItemResponse } from "../types/shared";
import { UseFoodItemsResult } from "../hooks/useFoodItems";
import { UseShoppingListResult } from "../hooks/useShoppingList";
import { apiPost, apiDelete } from "../utils/api";
import { getCategoryColor, stepQuantity } from "../config";
import { formatRelativeDays } from "../utils/dates";
import { t } from "../i18n";
import { EditableQuantity } from "./EditableQuantity";

interface RecipeDetailProps {
  recipe: Recipe;
  foodItems: UseFoodItemsResult;
  list: UseShoppingListResult;
  onEdit: () => void;
  onDelete: () => void;
  onBack: () => void;
}

export function RecipeDetail({
  recipe,
  foodItems,
  list,
  onEdit,
  onDelete,
  onBack,
}: RecipeDetailProps) {
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(recipe.ingredients.map((i) => i.foodItemId))
  );
  const [quantities, setQuantities] = useState<Map<string, number>>(
    () => new Map(recipe.ingredients.map((i) => [i.foodItemId, i.quantity]))
  );
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const allSelected = recipe.ingredients.every((i) => selected.has(i.foodItemId));
  const selectedCount = recipe.ingredients.filter((i) => selected.has(i.foodItemId)).length;

  function toggleIngredient(foodItemId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(foodItemId)) next.delete(foodItemId);
      else next.add(foodItemId);
      return next;
    });
    setAdded(false);
  }

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(recipe.ingredients.map((i) => i.foodItemId)));
    }
    setAdded(false);
  }

  function updateQuantity(foodItemId: string, quantity: number) {
    setQuantities((prev) => new Map(prev).set(foodItemId, quantity));
    setAdded(false);
  }

  async function addToList() {
    setAdding(true);
    setAdded(false);
    for (const ing of recipe.ingredients) {
      if (!selected.has(ing.foodItemId)) continue;
      const food = foodItems.byId.get(ing.foodItemId);
      if (!food) continue;
      const qty = quantities.get(ing.foodItemId) ?? ing.quantity;
      await apiPost<AddListItemResponse>("addListItem", {
        foodItemId: ing.foodItemId,
        quantity: qty,
      });
    }
    list.refresh();
    setAdding(false);
    setAdded(true);
  }

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    try {
      await apiDelete("deleteRecipe", recipe.id);
      onDelete();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : t("recipeDetail.deleteFailed"));
      setConfirmDelete(false);
    }
  }

  return (
    <div className="recipe-detail">
      <div className="recipe-detail-header">
        <button className="btn-back" onClick={onBack}>
          ← {t("recipeDetail.back")}
        </button>
        <div className="recipe-detail-actions">
          <button className="btn-secondary btn-small" onClick={onEdit}>
            {t("recipeDetail.edit")}
          </button>
          <button
            className={`btn-small ${confirmDelete ? "btn-danger" : "btn-secondary"}`}
            onClick={handleDelete}
          >
            {confirmDelete ? t("recipeDetail.confirmDelete") : t("recipeDetail.delete")}
          </button>
        </div>
      </div>

      <h1 className="recipe-detail-title">{recipe.name}</h1>

      {deleteError && <div className="banner-error">{deleteError}</div>}

      <div className="recipe-detail-toggle-all">
        <button className="btn-link" onClick={toggleAll}>
          {allSelected ? t("recipeDetail.deselectAll") : t("recipeDetail.selectAll")}
        </button>
      </div>

      <div className="recipe-ingredients-detail">
        {recipe.ingredients.map((ing) => {
          const food = foodItems.byId.get(ing.foodItemId);
          const qty = quantities.get(ing.foodItemId) ?? ing.quantity;
          const isSelected = selected.has(ing.foodItemId);
          const lastBought = food?.lastBought;
          const lastBoughtText = lastBought
            ? t("recipeDetail.lastBought", { when: formatRelativeDays(lastBought) })
            : t("recipeDetail.neverBought");

          return (
            <div
              key={ing.foodItemId}
              className={`recipe-detail-ingredient ${isSelected ? "" : "ingredient-deselected"}`}
            >
              <label className="recipe-detail-check">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleIngredient(ing.foodItemId)}
                />
                <span className="recipe-detail-ingredient-name">
                  {food?.name ?? t("recipeDetail.removedItem")}
                </span>
              </label>
              {food && (
                <span
                  className="category-chip category-chip-small"
                  style={{ backgroundColor: getCategoryColor(food.category) }}
                >
                  {food.category}
                </span>
              )}
              <div className="quantity-stepper">
                <button
                  type="button"
                  className="stepper-btn"
                  disabled={qty <= 0.25}
                  onClick={() => updateQuantity(ing.foodItemId, food ? stepQuantity(food.unit, qty, "down") : Math.max(1, qty - 1))}
                  aria-label={t("listItem.decrease")}
                >
                  −
                </button>
                <EditableQuantity
                  quantity={qty}
                  unit={food?.unit ?? ""}
                  onChange={(v) => updateQuantity(ing.foodItemId, v)}
                />
                <button
                  type="button"
                  className="stepper-btn"
                  onClick={() => updateQuantity(ing.foodItemId, food ? stepQuantity(food.unit, qty, "up") : qty + 1)}
                  aria-label={t("listItem.increase")}
                >
                  +
                </button>
              </div>
              <span className="recipe-detail-lastbought">{lastBoughtText}</span>
            </div>
          );
        })}
      </div>

      <div className="recipe-detail-footer">
        <button
          className="btn-primary btn-large"
          disabled={adding || selectedCount === 0}
          onClick={addToList}
        >
          {adding
            ? t("recipeDetail.adding")
            : added
              ? t("recipeDetail.added")
              : t("recipeDetail.addToList")}
        </button>
      </div>
    </div>
  );
}
