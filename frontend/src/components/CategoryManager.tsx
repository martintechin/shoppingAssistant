import { useState, useMemo } from "react";
import { FoodItem, BulkUpdateCategoryResponse } from "../types/shared";
import { getCategoryColor } from "../config";
import { apiPut } from "../utils/api";
import { t } from "../i18n";
import { Modal } from "./Modal";

interface CategoryManagerProps {
  foodItems: FoodItem[];
  categories: string[];
  onClose: () => void;
  onSaved: () => void;
}

type Screen = "list" | "new" | "assign";

export function CategoryManager({
  foodItems,
  categories,
  onClose,
  onSaved,
}: CategoryManagerProps) {
  const [screen, setScreen] = useState<Screen>("list");
  const [newName, setNewName] = useState("");
  const [assignTarget, setAssignTarget] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterQuery, setFilterQuery] = useState("");

  const countByCategory = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of foodItems) {
      counts.set(item.category, (counts.get(item.category) || 0) + 1);
    }
    return counts;
  }, [foodItems]);

  function handleCreateCategory() {
    const trimmed = newName.trim();
    if (!trimmed) return;
    if (categories.includes(trimmed)) {
      setError(t("catManager.alreadyExists"));
      return;
    }
    setNewName("");
    setScreen("list");
    setError(null);
    setAssignTarget(trimmed);
    setSelected(new Set());
    setScreen("assign");
  }

  function startAssign(category: string) {
    setAssignTarget(category);
    setSelected(new Set());
    setFilterQuery("");
    setError(null);
    setScreen("assign");
  }

  function toggleItem(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    const visible = filteredItems.map((i) => i.id);
    setSelected((prev) => {
      const next = new Set(prev);
      for (const id of visible) next.add(id);
      return next;
    });
  }

  function deselectAll() {
    const visible = new Set(filteredItems.map((i) => i.id));
    setSelected((prev) => {
      const next = new Set(prev);
      for (const id of visible) next.delete(id);
      return next;
    });
  }

  async function submitAssign() {
    if (!assignTarget || selected.size === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      await apiPut<BulkUpdateCategoryResponse>("bulkUpdateCategory", {
        foodItemIds: [...selected],
        category: assignTarget,
      });
      onSaved();
      setScreen("list");
      setSelected(new Set());
      setAssignTarget(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("catManager.updateFailed"));
    } finally {
      setSubmitting(false);
    }
  }

  const otherItems = useMemo(
    () =>
      assignTarget
        ? foodItems.filter((i) => i.category !== assignTarget)
        : [],
    [foodItems, assignTarget]
  );

  const assignedItems = useMemo(
    () =>
      assignTarget
        ? foodItems.filter((i) => i.category === assignTarget)
        : [],
    [foodItems, assignTarget]
  );

  const filteredItems = useMemo(() => {
    if (!filterQuery.trim()) return otherItems;
    const q = filterQuery.trim().toLowerCase();
    return otherItems.filter((i) => i.name.toLowerCase().includes(q));
  }, [otherItems, filterQuery]);

  if (screen === "new") {
    return (
      <Modal title={t("catManager.newTitle")} onClose={onClose}>
        <div className="form-field">
          <label htmlFor="new-cat-name">{t("catManager.nameLabel")}</label>
          <input
            id="new-cat-name"
            type="text"
            value={newName}
            onChange={(e) => { setNewName(e.target.value); setError(null); }}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleCreateCategory(); } }}
            autoComplete="off"
            autoFocus
          />
        </div>
        {error && <div className="form-error">{error}</div>}
        <div className="form-actions">
          <button className="btn-secondary" onClick={() => { setScreen("list"); setError(null); }}>
            {t("catManager.back")}
          </button>
          <button className="btn-primary" onClick={handleCreateCategory} disabled={!newName.trim()}>
            {t("catManager.createAndAssign")}
          </button>
        </div>
      </Modal>
    );
  }

  if (screen === "assign" && assignTarget) {
    const moveLabel = submitting
      ? t("catManager.saving")
      : selected.size === 1
        ? t("catManager.moveOne")
        : t("catManager.moveMany", { count: selected.size });

    return (
      <Modal title={t("catManager.assignTitle", { name: assignTarget })} onClose={onClose}>
        {assignedItems.length > 0 && (
          <div className="assign-section">
            <h3 className="assign-section-title">
              {t("catManager.alreadyIn", { count: assignedItems.length })}
            </h3>
            <div className="assign-already">
              {assignedItems.map((item) => (
                <span key={item.id} className="assign-chip">{item.name}</span>
              ))}
            </div>
          </div>
        )}

        <div className="assign-section">
          <h3 className="assign-section-title">{t("catManager.selectItems")}</h3>
          <input
            type="text"
            className="search-input"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder={t("catManager.filterPlaceholder")}
            autoComplete="off"
          />
          <div className="assign-bulk-actions">
            <button className="btn-small btn-secondary" onClick={selectAll}>
              {t("catManager.selectAll")}
            </button>
            <button className="btn-small btn-secondary" onClick={deselectAll}>
              {t("catManager.deselectAll")}
            </button>
            {selected.size > 0 && (
              <span className="assign-count">{t("catManager.selectedCount", { count: selected.size })}</span>
            )}
          </div>
          <div className="assign-list">
            {filteredItems.map((item) => (
              <label key={item.id} className="assign-item">
                <input
                  type="checkbox"
                  checked={selected.has(item.id)}
                  onChange={() => toggleItem(item.id)}
                />
                <span className="assign-item-name">{item.name}</span>
                <span
                  className="category-chip category-chip-small"
                  style={{ backgroundColor: getCategoryColor(item.category) }}
                >
                  {item.category}
                </span>
              </label>
            ))}
            {filteredItems.length === 0 && (
              <div className="empty-state">
                {filterQuery.trim() ? t("catManager.noMatch") : t("catManager.noItems")}
              </div>
            )}
          </div>
        </div>

        {error && <div className="form-error">{error}</div>}
        <div className="form-actions">
          <button className="btn-secondary" onClick={() => { setScreen("list"); setError(null); }}>
            {t("catManager.back")}
          </button>
          <button
            className="btn-primary"
            onClick={submitAssign}
            disabled={submitting || selected.size === 0}
          >
            {moveLabel}
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title={t("catManager.title")} onClose={onClose}>
      <div className="category-manager-list">
        {categories.map((cat) => (
          <button
            key={cat}
            className="category-manager-row"
            onClick={() => startAssign(cat)}
          >
            <span
              className="category-dot"
              style={{ backgroundColor: getCategoryColor(cat) }}
            />
            <span className="category-manager-name">{cat}</span>
            <span className="category-manager-count">
              {t("catManager.itemCount", { count: countByCategory.get(cat) || 0 })}
            </span>
          </button>
        ))}
      </div>
      <div className="form-actions">
        <button className="btn-secondary" onClick={onClose}>
          {t("catManager.close")}
        </button>
        <button className="btn-primary" onClick={() => { setScreen("new"); setError(null); setNewName(""); }}>
          {t("catManager.newCategory")}
        </button>
      </div>
    </Modal>
  );
}
