import { useState, useMemo } from "react";
import { FoodItem } from "../types/shared";
import { UseFoodItemsResult } from "../hooks/useFoodItems";
import { UseShoppingListResult } from "../hooks/useShoppingList";
import { getCategoryColor, getAllCategories } from "../config";
import { filterAndRank } from "../utils/text";
import { formatRelativeDays } from "../utils/dates";
import { t } from "../i18n";
import { FoodItemForm } from "./FoodItemForm";
import { CategoryManager } from "./CategoryManager";

interface FoodsViewProps {
  foodItems: UseFoodItemsResult;
  list: UseShoppingListResult;
}

export function FoodsView({ foodItems, list }: FoodsViewProps) {
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<FoodItem | null>(null);
  const [managingCategories, setManagingCategories] = useState(false);

  const categories = useMemo(
    () => getAllCategories(foodItems.items.map((i) => i.category)),
    [foodItems.items]
  );

  const trimmed = query.trim();
  const shown = trimmed
    ? filterAndRank(foodItems.items, trimmed, (item) => item.name, 200)
    : foodItems.items;

  return (
    <div className="foods-view">
      <div className="view-header">
        <h1>{t("foods.title")}</h1>
        <div className="view-header-actions">
          <span className="view-header-meta">{t("foods.count", { count: foodItems.items.length })}</span>
          <button
            className="btn-secondary btn-small"
            onClick={() => setManagingCategories(true)}
          >
            {t("foods.categories")}
          </button>
        </div>
      </div>

      <input
        type="text"
        className="search-input"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t("foods.searchPlaceholder")}
        autoComplete="off"
      />

      {foodItems.error && <div className="banner-error">{foodItems.error}</div>}

      {foodItems.loading && foodItems.items.length === 0 ? (
        <div className="empty-state">{t("foods.loading")}</div>
      ) : shown.length === 0 ? (
        <div className="empty-state">
          {trimmed ? t("foods.noMatch") : t("foods.empty")}
        </div>
      ) : (
        <div className="food-list">
          {shown.map((item) => (
            <button key={item.id} className="food-card" onClick={() => setEditing(item)}>
              <span className="food-card-main">
                <span className="food-card-name">{item.name}</span>
                <span className="food-card-meta">
                  {item.unit}
                  {item.lastBought && ` · ${t("foods.boughtWhen", { when: formatRelativeDays(item.lastBought) })}`}
                </span>
              </span>
              <span
                className="category-chip"
                style={{ backgroundColor: getCategoryColor(item.category) }}
              >
                {item.category}
              </span>
            </button>
          ))}
        </div>
      )}

      {editing && (
        <FoodItemForm
          item={editing}
          categories={categories}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            foodItems.refresh();
            list.refresh();
          }}
        />
      )}

      {managingCategories && (
        <CategoryManager
          foodItems={foodItems.items}
          categories={categories}
          onClose={() => setManagingCategories(false)}
          onSaved={() => {
            foodItems.refresh();
            list.refresh();
          }}
        />
      )}
    </div>
  );
}
