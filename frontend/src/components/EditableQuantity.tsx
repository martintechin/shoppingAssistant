import { useState } from "react";
import { LOCALE } from "../i18n";

interface EditableQuantityProps {
  quantity: number;
  unit: string;
  onChange: (quantity: number) => void;
}

export function EditableQuantity({ quantity, unit, onChange }: EditableQuantityProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  function save() {
    const parsed = parseFloat(draft.replace(",", "."));
    if (!isNaN(parsed) && parsed > 0) {
      onChange(Math.round(parsed * 100) / 100);
    }
    setEditing(false);
  }

  if (editing) {
    return (
      <input
        className="quantity-input"
        type="number"
        inputMode="decimal"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") save();
          if (e.key === "Escape") setEditing(false);
        }}
        onBlur={save}
        autoFocus
      />
    );
  }

  return (
    <button
      className="quantity-label"
      onClick={() => { setDraft(String(quantity)); setEditing(true); }}
    >
      {quantity.toLocaleString(LOCALE)} {unit}
    </button>
  );
}
