import { useState } from "react";
import { FoodItem } from "../types/shared";
import { filterAndRank } from "../utils/text";

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
              aria-label={`Ta bort ${item.name} från saknade varor`}
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
        placeholder="Sök vara att markera som saknad..."
        autoComplete="off"
      />

      {trimmed && (
        <div className="picker-results">
          {matches.length === 0 ? (
            <div className="picker-empty">Ingen träff</div>
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
