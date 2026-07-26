import { useState, useMemo } from "react";
import { Store } from "../types/shared";
import { UseFoodItemsResult } from "../hooks/useFoodItems";
import { UseStoresResult } from "../hooks/useStores";
import { getAllCategories } from "../config";
import { t } from "../i18n";
import { StoreForm } from "./StoreForm";

interface StoresViewProps {
  stores: UseStoresResult;
  foodItems: UseFoodItemsResult;
}

export function StoresView({ stores, foodItems }: StoresViewProps) {
  const categories = useMemo(
    () => getAllCategories(foodItems.items.map((i) => i.category)),
    [foodItems.items]
  );
  const [editing, setEditing] = useState<Store | "new" | null>(null);

  return (
    <div className="stores-view">
      <div className="view-header">
        <h1>{t("stores.title")}</h1>
        <button className="btn-primary" onClick={() => setEditing("new")}>
          {t("stores.newStore")}
        </button>
      </div>

      {stores.error && <div className="banner-error">{stores.error}</div>}

      {stores.loading && stores.stores.length === 0 ? (
        <div className="empty-state">{t("stores.loading")}</div>
      ) : stores.stores.length === 0 ? (
        <div className="empty-state">{t("stores.empty")}</div>
      ) : (
        <div className="store-list">
          {stores.stores.map((store) => (
            <button key={store.id} className="store-card" onClick={() => setEditing(store)}>
              <span className="store-card-name">{store.name}</span>
              <span className="store-card-meta">
                {t("stores.departments", { count: store.categoryOrder.length })}
                {store.unavailableItems.length > 0 &&
                  ` · ${t("stores.itemsMissing", { count: store.unavailableItems.length })}`}
              </span>
            </button>
          ))}
        </div>
      )}

      {editing !== null && (
        <StoreForm
          store={editing === "new" ? null : editing}
          categories={categories}
          foodItems={foodItems}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            stores.refresh();
          }}
        />
      )}
    </div>
  );
}
