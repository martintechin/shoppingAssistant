import { useState, FormEvent } from "react";
import { CATEGORIES, FoodItem, UNITS } from "../types/shared";
import { apiDelete, apiPut } from "../utils/api";
import { formatDate } from "../utils/dates";
import { Modal } from "./Modal";

interface FoodItemFormProps {
  item: FoodItem;
  onClose: () => void;
  onSaved: () => void;
}

export function FoodItemForm({ item, onClose, onSaved }: FoodItemFormProps) {
  const [name, setName] = useState(item.name);
  const [category, setCategory] = useState(item.category);
  const [unit, setUnit] = useState(item.unit);
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Ange ett namn");
      return;
    }

    setSubmitting(true);
    try {
      await apiPut("updateFoodItem", { id: item.id, name: trimmedName, category, unit });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunde inte spara varan");
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    setSubmitting(true);
    try {
      await apiDelete("deleteFoodItem", item.id);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunde inte ta bort varan");
      setSubmitting(false);
    }
  }

  return (
    <Modal title="Redigera vara" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="form-field">
          <label htmlFor="food-name">Namn</label>
          <input
            id="food-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="off"
          />
        </div>
        <div className="form-field">
          <label htmlFor="food-category">Kategori</label>
          <select
            id="food-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {/* Keep an unknown stored category selectable instead of silently remapping it */}
            {!CATEGORIES.includes(category as any) && (
              <option value={category}>{category}</option>
            )}
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
        <div className="form-field">
          <label htmlFor="food-unit">Enhet</label>
          <select id="food-unit" value={unit} onChange={(e) => setUnit(e.target.value)}>
            {!UNITS.includes(unit as any) && <option value={unit}>{unit}</option>}
            {UNITS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>

        {item.lastBought && (
          <p className="food-form-meta">Senast köpt: {formatDate(item.lastBought)}</p>
        )}

        {error && <div className="form-error">{error}</div>}

        <div className="form-actions">
          {confirmDelete ? (
            <button
              type="button"
              className="btn-danger"
              onClick={handleDelete}
              disabled={submitting}
            >
              Bekräfta borttagning
            </button>
          ) : (
            <button
              type="button"
              className="btn-danger-outline"
              onClick={() => setConfirmDelete(true)}
            >
              Ta bort
            </button>
          )}
          <button type="button" className="btn-secondary" onClick={onClose}>
            Avbryt
          </button>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? "Sparar..." : "Spara"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
