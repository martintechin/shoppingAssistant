import { useState, useMemo } from "react";
import {
  AddListItemResponse,
  FoodItem,
  ListItem,
  StoreFoodItemResponse,
} from "../types/shared";
import { UseFoodItemsResult } from "../hooks/useFoodItems";
import { UseShoppingListResult } from "../hooks/useShoppingList";
import { ApiError, apiDelete, apiPost, apiPut } from "../utils/api";
import { getCategoryColor, getDefaultQuantity, getAllCategories } from "../config";
import { groupByCategory, sortByStoreOrder } from "../utils/sorting";
import { t } from "../i18n";
import { AddItemBar } from "./AddItemBar";
import { NewFoodItemModal } from "./NewFoodItemModal";
import { ListItemRow } from "./ListItemRow";

interface ListViewProps {
  foodItems: UseFoodItemsResult;
  list: UseShoppingListResult;
}

export function ListView({ foodItems, list }: ListViewProps) {
  const [createName, setCreateName] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const categories = useMemo(
    () => getAllCategories(foodItems.items.map((i) => i.category)),
    [foodItems.items]
  );

  async function addToList(foodItem: FoodItem) {
    setActionError(null);
    try {
      await apiPost<AddListItemResponse>("addListItem", {
        foodItemId: foodItem.id,
        quantity: getDefaultQuantity(foodItem.unit),
      });
      list.refresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t("list.couldNotAdd"));
    }
  }

  async function createAndAdd(name: string, category: string, unit: string) {
    try {
      const result = await apiPost<StoreFoodItemResponse>("storeFoodItem", {
        name,
        category,
        unit,
      });
      foodItems.refresh();
      await apiPost<AddListItemResponse>("addListItem", {
        foodItemId: result.item.id,
        quantity: getDefaultQuantity(unit),
      });
    } catch (err) {
      if (err instanceof ApiError && err.status === 409 && err.data?.existingId) {
        await apiPost<AddListItemResponse>("addListItem", {
          foodItemId: err.data.existingId,
        });
      } else {
        throw err;
      }
    }
    list.refresh();
  }

  async function changeQuantity(item: ListItem, quantity: number) {
    list.mutate((items) =>
      items.map((i) => (i.id === item.id ? { ...i, quantity } : i))
    );
    try {
      await apiPut("updateListItem", { id: item.id, quantity });
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        list.refresh();
        return;
      }
      list.mutate((items) =>
        items.map((i) => (i.id === item.id ? { ...i, quantity: item.quantity } : i))
      );
    }
  }

  async function changeNote(item: ListItem, note: string) {
    list.mutate((items) =>
      items.map((i) => (i.id === item.id ? { ...i, note: note || undefined } : i))
    );
    try {
      await apiPut("updateListItem", { id: item.id, note });
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        list.refresh();
        return;
      }
      list.mutate((items) =>
        items.map((i) => (i.id === item.id ? { ...i, note: item.note } : i))
      );
    }
  }

  async function removeItem(item: ListItem) {
    setActionError(null);
    try {
      await apiDelete("deleteListItem", item.id);
      list.refresh();
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        list.refresh();
        return;
      }
      setActionError(err instanceof Error ? err.message : t("list.couldNotRemove"));
    }
  }

  const sorted = sortByStoreOrder(list.items, []);
  const groups = groupByCategory(sorted.filter((item) => !item.checked));
  const checkedItems = sorted.filter((item) => item.checked);

  return (
    <div className="list-view">
      <AddItemBar
        items={foodItems.items}
        listItems={list.items}
        onSelect={addToList}
        onCreateNew={setCreateName}
      />

      {actionError && <div className="banner-error">{actionError}</div>}
      {list.error && <div className="banner-error">{list.error}</div>}

      {list.loading && list.items.length === 0 ? (
        <div className="empty-state">{t("list.loading")}</div>
      ) : list.items.length === 0 ? (
        <div className="empty-state">{t("list.empty")}</div>
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
                <ListItemRow
                  key={item.id}
                  item={item}
                  onQuantity={(quantity) => changeQuantity(item, quantity)}
                  onNote={(note) => changeNote(item, note)}
                  onDelete={() => removeItem(item)}
                />
              ))}
            </section>
          ))}

          {checkedItems.length > 0 && (
            <section className="category-group checked-group">
              <h2 className="category-header">{t("list.checkedSection")}</h2>
              {checkedItems.map((item) => (
                <ListItemRow
                  key={item.id}
                  item={item}
                  onQuantity={(quantity) => changeQuantity(item, quantity)}
                  onNote={(note) => changeNote(item, note)}
                  onDelete={() => removeItem(item)}
                />
              ))}
            </section>
          )}
        </>
      )}

      {createName !== null && (
        <NewFoodItemModal
          initialName={createName}
          categories={categories}
          onClose={() => setCreateName(null)}
          onCreate={createAndAdd}
        />
      )}
    </div>
  );
}
