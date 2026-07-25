import { useState, FormEvent } from "react";
import { CATEGORIES, UNITS } from "../types/shared";
import { Modal } from "./Modal";

interface NewFoodItemModalProps {
  initialName: string;
  onClose: () => void;
  onCreate: (name: string, category: string, unit: string) => Promise<void>;
}

export function NewFoodItemModal({ initialName, onClose, onCreate }: NewFoodItemModalProps) {
  const [name, setName] = useState(initialName);
  const [category, setCategory] = useState<string>("Övrigt");
  const [unit, setUnit] = useState<string>("st");
  const [submitting, setSubmitting] = useState(false);
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
      await onCreate(trimmedName, category, unit);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunde inte skapa varan");
      setSubmitting(false);
    }
  }

  return (
    <Modal title="Ny vara" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="form-field">
          <label htmlFor="new-item-name">Namn</label>
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
          <label htmlFor="new-item-category">Kategori</label>
          <select
            id="new-item-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
        <div className="form-field">
          <label htmlFor="new-item-unit">Enhet</label>
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
            Avbryt
          </button>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? "Sparar..." : "Skapa och lägg till"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
