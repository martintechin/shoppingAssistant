import { Store } from "../types/shared";

interface StorePickerProps {
  stores: Store[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function StorePicker({ stores, selectedId, onSelect }: StorePickerProps) {
  if (stores.length === 0) return null;

  return (
    <div className="store-picker">
      {stores.map((store) => (
        <button
          key={store.id}
          className={`store-chip ${store.id === selectedId ? "store-chip-active" : ""}`}
          onClick={() => onSelect(store.id)}
        >
          {store.name}
        </button>
      ))}
    </div>
  );
}
