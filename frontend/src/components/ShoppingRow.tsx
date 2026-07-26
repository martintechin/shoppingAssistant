import { ListItem } from "../types/shared";
import { formatQuantity } from "./ListItemRow";
import { t } from "../i18n";

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
      <div className="shopping-row-info">
        <span className="shopping-row-name">{item.name}</span>
        {item.note && <span className="shopping-row-note">{item.note}</span>}
      </div>
      {unavailable && <span className="unavailable-badge">{t("shopping.unavailable")}</span>}
      <span className="shopping-row-quantity">{formatQuantity(item.quantity, item.unit)}</span>
    </button>
  );
}
