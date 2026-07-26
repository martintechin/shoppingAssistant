import { useState } from "react";
import { ActivationGate } from "./components/ActivationGate";
import { TabBar, View } from "./components/TabBar";
import { ListView } from "./components/ListView";
import { ShoppingView } from "./components/ShoppingView";
import { RecipesView } from "./components/RecipesView";
import { SettingsView } from "./components/SettingsView";
import { useFoodItems } from "./hooks/useFoodItems";
import { useShoppingList } from "./hooks/useShoppingList";
import { useStores } from "./hooks/useStores";
import { useRecipes } from "./hooks/useRecipes";
import { useTokenExpiry } from "./hooks/useTokenExpiry";
import { t } from "./i18n";

export default function App() {
  return (
    <ActivationGate>
      <AppShell />
    </ActivationGate>
  );
}

// Data hooks live here — inside the activation gate so they only start
// fetching once authenticated, and instantiated once so the 60s polling
// isn't duplicated per view.
function AppShell() {
  const [view, setView] = useState<View>("list");
  const foodItems = useFoodItems();
  const list = useShoppingList();
  const stores = useStores();
  const recipes = useRecipes();
  const tokenExpiry = useTokenExpiry();

  const uncheckedCount = list.items.filter((item) => !item.checked).length;

  return (
    <div className="app">
      {tokenExpiry.isExpiringSoon && (
        <div className="banner-warning">
          <span>
            {t("deviceTokens.expiryWarning", {
              days: tokenExpiry.daysUntilExpiry,
            })}
          </span>
          <button
            className="btn-link-warning"
            onClick={tokenExpiry.renew}
            disabled={tokenExpiry.renewing}
          >
            {tokenExpiry.renewing
              ? t("deviceTokens.renewing")
              : t("deviceTokens.renew")}
          </button>
        </div>
      )}
      <main className="view-container">
        {view === "list" && <ListView foodItems={foodItems} list={list} />}
        {view === "shop" && <ShoppingView list={list} stores={stores} />}
        {view === "recipes" && (
          <RecipesView foodItems={foodItems} list={list} recipes={recipes} />
        )}
        {view === "settings" && (
          <SettingsView
            foodItems={foodItems}
            list={list}
            stores={stores}
            tokenExpiry={tokenExpiry}
          />
        )}
      </main>
      <TabBar view={view} onChange={setView} listCount={uncheckedCount} />
    </div>
  );
}
