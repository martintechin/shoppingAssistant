import { useState, FormEvent } from "react";
import { CATEGORIES, UNITS, t } from "../i18n";
import { Modal } from "./Modal";

interface NewFoodItemModalProps {
  initialName: string;
  categories: string[];
  onClose: () => void;
  onCreate: (name: string, category: string, unit: string) => Promise<void>;
}

export function NewFoodItemModal({ initialName, categories, onClose, onCreate }: NewFoodItemModalProps) {
  const defaultCategory = CATEGORIES[CATEGORIES.length - 1];
  const defaultUnit = UNITS[0];
  const [name, setName] = useState(initialName);
  const [category, setCategory] = useState<string>(defaultCategory);
  const [unit, setUnit] = useState<string>(defaultUnit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError(t("newFood.emptyName"));
      return;
    }

    setSubmitting(true);
    try {
      await onCreate(trimmedName, category, unit);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("newFood.createFailed"));
      setSubmitting(false);
    }
  }

  return (
    <Modal title={t("newFood.title")} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="form-field">
          <label htmlFor="new-item-name">{t("foodForm.nameLabel")}</label>
          <input
            id="new-item-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="off"
            autoFocus
          />
        </div>
        <div className="form-field">
          <label htmlFor="new-item-category">{t("foodForm.categoryLabel")}</label>
          <select
            id="new-item-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
        <div className="form-field">
          <label htmlFor="new-item-unit">{t("foodForm.unitLabel")}</label>
          <select id="new-item-unit" value={unit} onChange={(e) => setUnit(e.target.value)}>
            {UNITS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>
        {error && <div className="form-error">{error}</div>}
        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>
            {t("newFood.cancel")}
          </button>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? t("newFood.saving") : t("newFood.submit")}
          </button>
        </div>
      </form>
    </Modal>
  );
}
