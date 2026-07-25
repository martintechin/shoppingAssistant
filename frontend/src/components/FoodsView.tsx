import { useState } from "react";
import { FoodItem } from "../types/shared";
import { UseFoodItemsResult } from "../hooks/useFoodItems";
import { UseShoppingListResult } from "../hooks/useShoppingList";
import { getCategoryColor } from "../config";
import { filterAndRank } from "../utils/text";
import { formatRelativeDays } from "../utils/dates";
import { FoodItemForm } from "./FoodItemForm";

interface FoodsViewProps {
  foodItems: UseFoodItemsResult;
  list: UseShoppingListResult;
}

export function FoodsView({ foodItems, list }: FoodsViewProps) {
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<FoodItem | null>(null);

  const trimmed = query.trim();
  const shown = trimmed
    ? filterAndRank(foodItems.items, trimmed, (item) => item.name, 200)
    : foodItems.items;

  return (
    <div className="foods-view">
      <div className="view-header">
        <h1>Varor</h1>
        <span className="view-header-meta">{foodItems.items.length} st</span>
      </div>

      <input
        type="text"
        className="search-input"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Sök i varudatabasen..."
        autoComplete="off"
      />

      {foodItems.error && <div className="banner-error">{foodItems.error}</div>}

      {foodItems.loading && foodItems.items.length === 0 ? (
        <div className="empty-state">Laddar varor...</div>
      ) : shown.length === 0 ? (
        <div className="empty-state">
          {trimmed ? "Ingen träff." : "Varudatabasen är tom."}
        </div>
      ) : (
        <div className="food-list">
          {shown.map((item) => (
            <button key={item.id} className="food-card" onClick={() => setEditing(item)}>
              <span className="food-card-main">
                <span className="food-card-name">{item.name}</span>
                <span className="food-card-meta">
                  {item.unit}
                  {item.lastBought && ` · Köpt ${formatRelativeDays(item.lastBought)}`}
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
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            foodItems.refresh();
            list.refresh();
          }}
        />
      )}
    </div>
  );
}
