import { getCategoryColor } from "../config";

interface CategoryOrderEditorProps {
  order: string[];
  onChange: (order: string[]) => void;
}

// Up/down arrow reordering — deliberate choice over drag-and-drop: reliable
// on touch screens and needs no library.
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
            aria-label={`Flytta ${category} uppåt`}
          >
            ▲
          </button>
          <button
            type="button"
            className="order-btn"
            onClick={() => move(index, 1)}
            disabled={index === order.length - 1}
            aria-label={`Flytta ${category} nedåt`}
          >
            ▼
          </button>
        </div>
      ))}
    </div>
  );
}
