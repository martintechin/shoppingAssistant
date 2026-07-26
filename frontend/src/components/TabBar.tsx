import { t } from "../i18n";

export type View = "list" | "shop" | "recipes" | "settings";

interface TabBarProps {
  view: View;
  onChange: (view: View) => void;
  listCount: number;
}

const TABS: Array<{ id: View; labelKey: string; icon: string }> = [
  { id: "list", labelKey: "tab.list", icon: "📝" },
  { id: "shop", labelKey: "tab.shop", icon: "🛒" },
  { id: "recipes", labelKey: "tab.recipes", icon: "📖" },
  { id: "settings", labelKey: "tab.settings", icon: "⚙️" },
];

export function TabBar({ view, onChange, listCount }: TabBarProps) {
  return (
    <nav className="tab-bar">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          className={`tab ${view === tab.id ? "tab-active" : ""}`}
          onClick={() => onChange(tab.id)}
          aria-current={view === tab.id ? "page" : undefined}
        >
          <span className="tab-icon" aria-hidden="true">
            {tab.icon}
            {tab.id === "list" && listCount > 0 && (
              <span className="tab-badge">{listCount}</span>
            )}
          </span>
          <span className="tab-label">{t(tab.labelKey)}</span>
        </button>
      ))}
    </nav>
  );
}
