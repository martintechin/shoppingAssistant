import { useState, FormEvent } from "react";
import { Store } from "../types/shared";
import { UseFoodItemsResult } from "../hooks/useFoodItems";
import { apiDelete, apiPost, apiPut } from "../utils/api";
import { Modal } from "./Modal";
import { CategoryOrderEditor } from "./CategoryOrderEditor";
import { UnavailablePicker } from "./UnavailablePicker";

interface StoreFormProps {
  store: Store | null; // null = create new
  categories: string[];
  foodItems: UseFoodItemsResult;
  onClose: () => void;
  onSaved: () => void;
}

function initialOrder(store: Store | null, categories: string[]): string[] {
  const saved = store?.categoryOrder ?? [];
  return [...saved, ...categories.filter((category) => !saved.includes(category))];
}

export function StoreForm({ store, categories, foodItems, onClose, onSaved }: StoreFormProps) {
  const [name, setName] = useState(store?.name ?? "");
  const [order, setOrder] = useState<string[]>(() => initialOrder(store, categories));
  const [unavailable, setUnavailable] = useState<Set<string>>(
    () => new Set(store?.unavailableItems ?? [])
  );
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleUnavailable(id: string) {
    setUnavailable((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Ange ett namn på butiken");
      return;
    }

    setSubmitting(true);
    try {
      // Only keep unavailable ids that still exist in the food database.
      const unavailableItems = [...unavailable].filter((id) => foodItems.byId.has(id));
      if (store) {
        await apiPut("updateStore", {
          id: store.id,
          name: trimmedName,
          categoryOrder: order,
          unavailableItems,
        });
      } else {
        await apiPost("storeStore", {
          name: trimmedName,
          categoryOrder: order,
          unavailableItems,
        });
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunde inte spara butiken");
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!store) return;
    setSubmitting(true);
    try {
      await apiDelete("deleteStore", store.id);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunde inte ta bort butiken");
      setSubmitting(false);
    }
  }

  return (
    <Modal title={store ? "Redigera butik" : "Ny butik"} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="form-field">
          <label htmlFor="store-name">Namn</label>
          <input
            id="store-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="t.ex. ICA Maxi Häggvik"
            autoComplete="off"
            autoFocus={!store}
          />
        </div>

        <div className="form-field">
          <label>Avdelningsordning (din väg genom butiken)</label>
          <CategoryOrderEditor order={order} onChange={setOrder} />
        </div>

        <div className="form-field">
          <label>Varor som saknas i butiken</label>
          <UnavailablePicker
            foodItems={foodItems.items}
            selected={unavailable}
            onToggle={toggleUnavailable}
          />
        </div>

        {error && <div className="form-error">{error}</div>}

        <div className="form-actions">
          {store &&
            (confirmDelete ? (
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
            ))}
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
