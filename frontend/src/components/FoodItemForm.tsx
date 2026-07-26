import { useState, FormEvent } from "react";
import { FoodItem } from "../types/shared";
import { UNITS, t } from "../i18n";
import { apiDelete, apiPut } from "../utils/api";
import { formatDate } from "../utils/dates";
import { Modal } from "./Modal";

interface FoodItemFormProps {
  item: FoodItem;
  categories: string[];
  onClose: () => void;
  onSaved: () => void;
}

export function FoodItemForm({ item, categories, onClose, onSaved }: FoodItemFormProps) {
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
      setError(t("foodForm.emptyName"));
      return;
    }

    setSubmitting(true);
    try {
      await apiPut("updateFoodItem", { id: item.id, name: trimmedName, category, unit });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("foodForm.saveFailed"));
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    setSubmitting(true);
    try {
      await apiDelete("deleteFoodItem", item.id);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("foodForm.deleteFailed"));
      setSubmitting(false);
    }
  }

  return (
    <Modal title={t("foodForm.editTitle")} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="form-field">
          <label htmlFor="food-name">{t("foodForm.nameLabel")}</label>
          <input
            id="food-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="off"
          />
        </div>
        <div className="form-field">
          <label htmlFor="food-category">{t("foodForm.categoryLabel")}</label>
          <select
            id="food-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {!categories.includes(category) && (
              <option value={category}>{category}</option>
            )}
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
        <div className="form-field">
          <label htmlFor="food-unit">{t("foodForm.unitLabel")}</label>
          <select id="food-unit" value={unit} onChange={(e) => setUnit(e.target.value)}>
            {!UNITS.includes(unit) && <option value={unit}>{unit}</option>}
            {UNITS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>

        {item.lastBought && (
          <p className="food-form-meta">{t("foodForm.lastBought", { date: formatDate(item.lastBought) })}</p>
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
              {t("foodForm.confirmDelete")}
            </button>
          ) : (
            <button
              type="button"
              className="btn-danger-outline"
              onClick={() => setConfirmDelete(true)}
            >
              {t("foodForm.delete")}
            </button>
          )}
          <button type="button" className="btn-secondary" onClick={onClose}>
            {t("foodForm.cancel")}
          </button>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? t("foodForm.saving") : t("foodForm.save")}
          </button>
        </div>
      </form>
    </Modal>
  );
}
