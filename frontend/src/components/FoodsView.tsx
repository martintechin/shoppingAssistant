import { useState, useMemo, useRef } from "react";
import { FoodItem, ImportFoodItemsResponse } from "../types/shared";
import { UseFoodItemsResult } from "../hooks/useFoodItems";
import { UseShoppingListResult } from "../hooks/useShoppingList";
import { getCategoryColor, getAllCategories } from "../config";
import { filterAndRank } from "../utils/text";
import { formatRelativeDays } from "../utils/dates";
import { apiPost } from "../utils/api";
import { foodItemsToCsv, parseFoodItemsCsv, downloadCsv } from "../utils/csv";
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
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = useMemo(
    () => getAllCategories(foodItems.items.map((i) => i.category)),
    [foodItems.items]
  );

  const trimmed = query.trim();
  const shown = trimmed
    ? filterAndRank(foodItems.items, trimmed, (item) => item.name, 200)
    : foodItems.items;

  function handleExport() {
    const csv = foodItemsToCsv(foodItems.items);
    downloadCsv(csv, "food-items.csv");
  }

  async function handleImport(file: File) {
    setImporting(true);
    setImportMsg(null);
    try {
      const text = await file.text();
      const items = parseFoodItemsCsv(text);
      if (items.length === 0) {
        setImportMsg(t("foods.importFailed"));
        return;
      }
      const result = await apiPost<ImportFoodItemsResponse>("importFoodItems", { items });
      let msg = t("foods.importSuccess", {
        created: result.created,
        updated: result.updated,
        skipped: result.skipped,
      });
      if (result.errors.length > 0) {
        msg += " " + t("foods.importErrors", { errors: result.errors.join("; ") });
      }
      setImportMsg(msg);
      foodItems.refresh();
      list.refresh();
    } catch (err) {
      setImportMsg(err instanceof Error ? err.message : t("foods.importFailed"));
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

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

      <div className="import-export-bar">
        <button className="btn-secondary btn-small" onClick={handleExport} disabled={foodItems.items.length === 0}>
          {t("foods.export")}
        </button>
        <button
          className="btn-secondary btn-small"
          onClick={() => fileInputRef.current?.click()}
          disabled={importing}
        >
          {importing ? t("foods.importing") : t("foods.import")}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          style={{ display: "none" }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImport(file);
          }}
        />
      </div>

      {importMsg && (
        <div className="banner-info">{importMsg}</div>
      )}

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
