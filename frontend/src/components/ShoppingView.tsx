import { useState } from "react";
import { ClearCheckedResponse, ListItem, Store } from "../types/shared";
import { UseShoppingListResult } from "../hooks/useShoppingList";
import { UseStoresResult } from "../hooks/useStores";
import { ApiError, apiPost, apiPut } from "../utils/api";
import { getCategoryColor } from "../config";
import { groupByCategory, sortByStoreOrder } from "../utils/sorting";
import { t } from "../i18n";
import { StorePicker } from "./StorePicker";
import { ShoppingRow } from "./ShoppingRow";

const SELECTED_STORE_KEY = "shoppingassistant_selected_store";

interface ShoppingViewProps {
  list: UseShoppingListResult;
  stores: UseStoresResult;
}

export function ShoppingView({ list, stores }: ShoppingViewProps) {
  const [storeId, setStoreId] = useState<string | null>(() =>
    localStorage.getItem(SELECTED_STORE_KEY)
  );
  const [confirmClear, setConfirmClear] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const store: Store | null = stores.stores.find((s) => s.id === storeId) ?? null;

  function selectStore(id: string) {
    setStoreId(id);
    localStorage.setItem(SELECTED_STORE_KEY, id);
  }

  async function toggle(item: ListItem) {
    setActionError(null);
    const nextChecked = !item.checked;
    list.mutate((items) =>
      items.map((i) => (i.id === item.id ? { ...i, checked: nextChecked } : i))
    );
    try {
      await apiPut("updateListItem", { id: item.id, checked: nextChecked });
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        list.refresh();
        return;
      }
      list.mutate((items) =>
        items.map((i) => (i.id === item.id ? { ...i, checked: item.checked } : i))
      );
      setActionError(err instanceof Error ? err.message : t("shop.updateFailed"));
    }
  }

  async function clearChecked() {
    setActionError(null);
    try {
      await apiPost<ClearCheckedResponse>("clearChecked", {});
      setConfirmClear(false);
      list.refresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t("shop.clearFailed"));
    }
  }

  const sorted = sortByStoreOrder(list.items, store?.categoryOrder ?? []);
  const groups = groupByCategory(sorted);
  const unavailableIds = new Set(store?.unavailableItems ?? []);
  const checkedCount = list.items.filter((item) => item.checked).length;

  return (
    <div className="shopping-view">
      <StorePicker stores={stores.stores} selectedId={storeId} onSelect={selectStore} />

      {store === null && stores.stores.length > 0 && (
        <div className="banner-hint">{t("shop.hintSelectStore")}</div>
      )}
      {stores.stores.length === 0 && !stores.loading && (
        <div className="banner-hint">{t("shop.hintAddStore")}</div>
      )}

      {actionError && <div className="banner-error">{actionError}</div>}
      {list.error && <div className="banner-error">{list.error}</div>}

      {list.loading && list.items.length === 0 ? (
        <div className="empty-state">{t("shop.loading")}</div>
      ) : list.items.length === 0 ? (
        <div className="empty-state">{t("shop.empty")}</div>
      ) : (
        <>
          {groups.map(([category, items]) => (
            <section key={category} className="category-group">
              <h2 className="category-header">
                <span
                  className="category-dot"
                  style={{ backgroundColor: getCategoryColor(category) }}
                />
                {category}
              </h2>
              {items.map((item) => (
                <ShoppingRow
                  key={item.id}
                  item={item}
                  unavailable={unavailableIds.has(item.foodItemId)}
                  onToggle={() => toggle(item)}
                />
              ))}
            </section>
          ))}

          {checkedCount > 0 && (
            <div className="clear-checked">
              {confirmClear ? (
                <div className="confirm-actions">
                  <button className="btn-danger" onClick={clearChecked}>
                    {t("shop.confirmClear")}
                  </button>
                  <button className="btn-secondary" onClick={() => setConfirmClear(false)}>
                    {t("shop.cancel")}
                  </button>
                </div>
              ) : (
                <button className="btn-secondary" onClick={() => setConfirmClear(true)}>
                  {t("shop.clearChecked", { count: checkedCount })}
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
