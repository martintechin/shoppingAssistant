import { useState } from "react";
import { FoodItem, ListItem } from "../types/shared";
import { filterAndRank, normalize } from "../utils/text";
import { daysSince, formatRelativeDays } from "../utils/dates";
import { RECENTLY_BOUGHT_DAYS, getCategoryColor } from "../config";
import { t } from "../i18n";

interface AddItemBarProps {
  items: FoodItem[];
  listItems: ListItem[];
  onSelect: (item: FoodItem) => void;
  onCreateNew: (name: string) => void;
}

function isRecentlyBought(item: FoodItem): boolean {
  return daysSince(item.lastBought) <= RECENTLY_BOUGHT_DAYS;
}

export function AddItemBar({ items, listItems, onSelect, onCreateNew }: AddItemBarProps) {
  const [query, setQuery] = useState("");
  const [confirming, setConfirming] = useState<FoodItem | null>(null);

  const trimmed = query.trim();
  const suggestions = filterAndRank(items, trimmed, (item) => item.name);
  const hasExactMatch = suggestions.some(
    (item) => normalize(item.name) === normalize(trimmed)
  );
  const onListIds = new Set(
    listItems.filter((item) => !item.checked).map((item) => item.foodItemId)
  );

  function commit(item: FoodItem) {
    onSelect(item);
    setQuery("");
    setConfirming(null);
  }

  function choose(item: FoodItem) {
    if (isRecentlyBought(item)) {
      setConfirming(item);
    } else {
      commit(item);
    }
  }

  function handleCreate() {
    onCreateNew(trimmed);
    setQuery("");
    setConfirming(null);
  }

  return (
    <div className="add-bar">
      <input
        type="text"
        className="add-input"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setConfirming(null);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && trimmed && !confirming) {
            e.preventDefault();
            if (suggestions.length > 0) {
              choose(suggestions[0]);
            } else {
              handleCreate();
            }
          }
        }}
        placeholder={t("addItem.placeholder")}
        autoComplete="off"
        enterKeyHint="done"
      />

      {trimmed && (
        <div className="suggestions">
          {confirming ? (
            <div className="suggestion-confirm">
              <span className="confirm-text">
                {t("addItem.boughtRecently", {
                  name: confirming.name,
                  when: formatRelativeDays(confirming.lastBought),
                })}
              </span>
              <div className="confirm-actions">
                <button className="btn-small btn-primary" onClick={() => commit(confirming)}>
                  {t("addItem.addAnyway")}
                </button>
                <button className="btn-small" onClick={() => setConfirming(null)}>
                  {t("addItem.cancel")}
                </button>
              </div>
            </div>
          ) : (
            <>
              {suggestions.map((item) => (
                <button key={item.id} className="suggestion" onClick={() => choose(item)}>
                  <span className="suggestion-main">
                    <span className="suggestion-name">{item.name}</span>
                    {onListIds.has(item.id) && (
                      <span className="suggestion-onlist">{t("addItem.onList")}</span>
                    )}
                    {isRecentlyBought(item) && (
                      <span className="suggestion-recent">
                        {t("addItem.boughtWhen", { when: formatRelativeDays(item.lastBought) })}
                      </span>
                    )}
                  </span>
                  <span
                    className="category-chip"
                    style={{ backgroundColor: getCategoryColor(item.category) }}
                  >
                    {item.category}
                  </span>
                </button>
              ))}
              {!hasExactMatch && (
                <button className="suggestion suggestion-create" onClick={handleCreate}>
                  {t("addItem.create", { name: trimmed })}
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
