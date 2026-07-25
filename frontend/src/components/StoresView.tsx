import { useState } from "react";
import { Store } from "../types/shared";
import { UseFoodItemsResult } from "../hooks/useFoodItems";
import { UseStoresResult } from "../hooks/useStores";
import { StoreForm } from "./StoreForm";

interface StoresViewProps {
  stores: UseStoresResult;
  foodItems: UseFoodItemsResult;
}

export function StoresView({ stores, foodItems }: StoresViewProps) {
  const [editing, setEditing] = useState<Store | "new" | null>(null);

  return (
    <div className="stores-view">
      <div className="view-header">
        <h1>Butiker</h1>
        <button className="btn-primary" onClick={() => setEditing("new")}>
          + Ny butik
        </button>
      </div>

      {stores.error && <div className="banner-error">{stores.error}</div>}

      {stores.loading && stores.stores.length === 0 ? (
        <div className="empty-state">Laddar butiker...</div>
      ) : stores.stores.length === 0 ? (
        <div className="empty-state">
          Inga butiker ännu. Lägg till dina vanliga butiker och ange i vilken ordning
          avdelningarna kommer när du går genom butiken.
        </div>
      ) : (
        <div className="store-list">
          {stores.stores.map((store) => (
            <button key={store.id} className="store-card" onClick={() => setEditing(store)}>
              <span className="store-card-name">{store.name}</span>
              <span className="store-card-meta">
                {store.categoryOrder.length} avdelningar
                {store.unavailableItems.length > 0 &&
                  ` · ${store.unavailableItems.length} varor saknas`}
              </span>
            </button>
          ))}
        </div>
      )}

      {editing !== null && (
        <StoreForm
          store={editing === "new" ? null : editing}
          foodItems={foodItems}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            stores.refresh();
          }}
        />
      )}
    </div>
  );
}
