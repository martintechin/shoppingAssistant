import { useState } from "react";
import { FoodItem } from "../types/shared";
import { filterAndRank } from "../utils/text";
import { t } from "../i18n";

interface UnavailablePickerProps {
  foodItems: FoodItem[];
  selected: Set<string>;
  onToggle: (id: string) => void;
}

export function UnavailablePicker({ foodItems, selected, onToggle }: UnavailablePickerProps) {
  const [query, setQuery] = useState("");
  const trimmed = query.trim();

  const matches = trimmed ? filterAndRank(foodItems, trimmed, (item) => item.name) : [];
  const selectedItems = foodItems.filter((item) => selected.has(item.id));

  return (
    <div className="unavailable-picker">
      {selectedItems.length > 0 && (
        <div className="unavailable-chips">
          {selectedItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className="unavailable-chip"
              onClick={() => onToggle(item.id)}
              aria-label={t("unavailable.removeLabel", { name: item.name })}
            >
              {item.name} ✕
            </button>
          ))}
        </div>
      )}

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t("unavailable.placeholder")}
        autoComplete="off"
      />

      {trimmed && (
        <div className="picker-results">
          {matches.length === 0 ? (
            <div className="picker-empty">{t("unavailable.noMatch")}</div>
          ) : (
            matches.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`picker-result ${selected.has(item.id) ? "picker-result-selected" : ""}`}
                onClick={() => onToggle(item.id)}
              >
                <span>{item.name}</span>
                {selected.has(item.id) && <span aria-hidden="true">✓</span>}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
