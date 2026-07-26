import { useState } from "react";
import { t } from "../i18n";
import { FoodsView } from "./FoodsView";
import { StoresView } from "./StoresView";
import type { UseFoodItemsResult } from "../hooks/useFoodItems";
import type { UseShoppingListResult } from "../hooks/useShoppingList";
import type { UseStoresResult } from "../hooks/useStores";

type SettingsSubView = "menu" | "foods" | "stores" | "deviceTokens";

interface SettingsViewProps {
  foodItems: UseFoodItemsResult;
  list: UseShoppingListResult;
  stores: UseStoresResult;
}

const MENU_ITEMS: Array<{
  id: SettingsSubView;
  labelKey: string;
  icon: string;
}> = [
  { id: "foods", labelKey: "settings.foods", icon: "🥕" },
  { id: "stores", labelKey: "settings.stores", icon: "🏬" },
  { id: "deviceTokens", labelKey: "settings.deviceTokens", icon: "📱" },
];

export function SettingsView({ foodItems, list, stores }: SettingsViewProps) {
  const [subView, setSubView] = useState<SettingsSubView>("menu");

  if (subView === "foods") {
    return (
      <div>
        <button
          className="settings-back-btn"
          onClick={() => setSubView("menu")}
        >
          {"← " + t("settings.back")}
        </button>
        <FoodsView foodItems={foodItems} list={list} />
      </div>
    );
  }

  if (subView === "stores") {
    return (
      <div>
        <button
          className="settings-back-btn"
          onClick={() => setSubView("menu")}
        >
          {"← " + t("settings.back")}
        </button>
        <StoresView stores={stores} foodItems={foodItems} />
      </div>
    );
  }

  if (subView === "deviceTokens") {
    return (
      <div>
        <button
          className="settings-back-btn"
          onClick={() => setSubView("menu")}
        >
          {"← " + t("settings.back")}
        </button>
        <div className="view-header">
          <h1>{t("deviceTokens.title")}</h1>
        </div>
        <div className="empty-state">{t("deviceTokens.placeholder")}</div>
      </div>
    );
  }

  return (
    <div className="settings-view">
      <div className="view-header">
        <h1>{t("settings.title")}</h1>
      </div>
      <div className="settings-menu">
        {MENU_ITEMS.map((item) => (
          <button
            key={item.id}
            className="settings-menu-item"
            onClick={() => setSubView(item.id)}
          >
            <span className="settings-menu-icon">{item.icon}</span>
            <span>{t(item.labelKey)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
