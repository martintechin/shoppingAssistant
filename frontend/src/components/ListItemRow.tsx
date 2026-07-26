import { useState } from "react";
import { ListItem } from "../types/shared";
import { stepQuantity } from "../config";
import { LOCALE, t } from "../i18n";
import { EditableQuantity } from "./EditableQuantity";

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

  const decrease = stepQuantity(item.unit, item.quantity, "down");
  const increase = stepQuantity(item.unit, item.quantity, "up");

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
              placeholder={t("listItem.notePlaceholder")}
              autoFocus
            />
          </div>
        ) : (
          <button
            className="note-toggle"
            onClick={() => { setDraft(item.note ?? ""); setEditingNote(true); }}
            aria-label={t("listItem.editNote")}
          >
            {item.note ? item.note : t("listItem.addNote")}
          </button>
        )}
      </div>
      <div className="quantity-stepper">
        <button
          className="stepper-btn"
          onClick={() => onQuantity(decrease)}
          disabled={decrease >= item.quantity}
          aria-label={t("listItem.decrease")}
        >
          −
        </button>
        <EditableQuantity quantity={item.quantity} unit={item.unit} onChange={onQuantity} />
        <button
          className="stepper-btn"
          onClick={() => onQuantity(increase)}
          aria-label={t("listItem.increase")}
        >
          +
        </button>
      </div>
      <button className="row-delete" onClick={onDelete} aria-label={t("listItem.remove", { name: item.name })}>
        ✕
      </button>
    </div>
  );
}
