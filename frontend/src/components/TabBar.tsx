export type View = "list" | "shop" | "foods" | "stores";

interface TabBarProps {
  view: View;
  onChange: (view: View) => void;
  listCount: number;
}

const TABS: Array<{ id: View; label: string; icon: string }> = [
  { id: "list", label: "Lista", icon: "📝" },
  { id: "shop", label: "Handla", icon: "🛒" },
  { id: "foods", label: "Varor", icon: "🥕" },
  { id: "stores", label: "Butiker", icon: "🏬" },
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
          <span className="tab-label">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
