import { getCategoryColor } from "../config";
import { t } from "../i18n";

interface CategoryOrderEditorProps {
  order: string[];
  onChange: (order: string[]) => void;
}

export function CategoryOrderEditor({ order, onChange }: CategoryOrderEditorProps) {
  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= order.length) return;
    const next = [...order];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div className="order-editor">
      {order.map((category, index) => (
        <div key={category} className="order-row">
          <span
            className="category-dot"
            style={{ backgroundColor: getCategoryColor(category) }}
          />
          <span className="order-row-name">{category}</span>
          <button
            type="button"
            className="order-btn"
            onClick={() => move(index, -1)}
            disabled={index === 0}
            aria-label={t("catOrder.moveUp", { name: category })}
          >
            ▲
          </button>
          <button
            type="button"
            className="order-btn"
            onClick={() => move(index, 1)}
            disabled={index === order.length - 1}
            aria-label={t("catOrder.moveDown", { name: category })}
          >
            ▼
          </button>
        </div>
      ))}
    </div>
  );
}
