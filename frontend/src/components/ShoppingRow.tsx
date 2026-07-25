import { ListItem } from "../types/shared";
import { formatQuantity } from "./ListItemRow";

interface ShoppingRowProps {
  item: ListItem;
  unavailable: boolean;
  onToggle: () => void;
}

export function ShoppingRow({ item, unavailable, onToggle }: ShoppingRowProps) {
  return (
    <button
      className={`shopping-row ${item.checked ? "shopping-row-checked" : ""} ${
        unavailable ? "shopping-row-unavailable" : ""
      }`}
      onClick={onToggle}
      role="checkbox"
      aria-checked={item.checked}
    >
      <span className="check-circle" aria-hidden="true">
        {item.checked ? "✓" : ""}
      </span>
      <span className="shopping-row-name">{item.name}</span>
      {unavailable && <span className="unavailable-badge">Finns ej här</span>}
      <span className="shopping-row-quantity">{formatQuantity(item.quantity, item.unit)}</span>
    </button>
  );
}
