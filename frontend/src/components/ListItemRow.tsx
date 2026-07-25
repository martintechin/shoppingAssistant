import { ListItem } from "../types/shared";
import { getUnitStep } from "../config";
import { LOCALE } from "../config";

interface ListItemRowProps {
  item: ListItem;
  onQuantity: (quantity: number) => void;
  onDelete: () => void;
}

export function formatQuantity(quantity: number, unit: string): string {
  return `${quantity.toLocaleString(LOCALE)} ${unit}`;
}

export function ListItemRow({ item, onQuantity, onDelete }: ListItemRowProps) {
  const step = getUnitStep(item.unit);
  // Guard against float drift from repeated 0.5/100 steps.
  const decrease = Math.round((item.quantity - step) * 100) / 100;
  const increase = Math.round((item.quantity + step) * 100) / 100;

  return (
    <div className={`list-row ${item.checked ? "list-row-checked" : ""}`}>
      <span className="list-row-name">{item.name}</span>
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
