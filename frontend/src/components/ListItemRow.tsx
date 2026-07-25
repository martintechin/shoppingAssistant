import { useState } from "react";
import { ListItem } from "../types/shared";
import { getUnitStep } from "../config";
import { LOCALE } from "../config";

interface ListItemRowProps {
  item: ListItem;
  onQuantity: (quantity: number) => void;
  onNote: (note: string) => void;
  onDelete: () => void;
}

export function formatQuantity(quantity: number, unit: string): string {
  return `${quantity.toLocaleString(LOCALE)} ${unit}`;
}

export function ListItemRow({ item, onQuantity, onNote, onDelete }: ListItemRowProps) {
  const [editingNote, setEditingNote] = useState(false);
  const [draft, setDraft] = useState(item.note ?? "");

  const step = getUnitStep(item.unit);
  const decrease = Math.round((item.quantity - step) * 100) / 100;
  const increase = Math.round((item.quantity + step) * 100) / 100;

  function saveNote() {
    const trimmed = draft.trim();
    onNote(trimmed);
    setEditingNote(false);
  }

  return (
    <div className={`list-row ${item.checked ? "list-row-checked" : ""}`}>
      <div className="list-row-info">
        <span className="list-row-name">{item.name}</span>
        {editingNote ? (
          <div className="note-edit">
            <input
              className="note-input"
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveNote();
                if (e.key === "Escape") {
                  setDraft(item.note ?? "");
                  setEditingNote(false);
                }
              }}
              onBlur={saveNote}
              placeholder="Skriv en anteckning..."
              autoFocus
            />
          </div>
        ) : (
          <button
            className="note-toggle"
            onClick={() => { setDraft(item.note ?? ""); setEditingNote(true); }}
            aria-label="Redigera anteckning"
          >
            {item.note ? item.note : "Lägg till anteckning..."}
          </button>
        )}
      </div>
      <div className="quantity-stepper">
        <button
          className="stepper-btn"
          onClick={() => onQuantity(decrease)}
          disabled={decrease <= 0}
          aria-label="Minska antal"
        >
          −
        </button>
        <span className="quantity-label">{formatQuantity(item.quantity, item.unit)}</span>
        <button
          className="stepper-btn"
          onClick={() => onQuantity(increase)}
          aria-label="Öka antal"
        >
          +
        </button>
      </div>
      <button className="row-delete" onClick={onDelete} aria-label={`Ta bort ${item.name}`}>
        ✕
      </button>
    </div>
  );
}
