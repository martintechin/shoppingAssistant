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

  const uncheckedCount = list.items.filter((item) => !item.checked).length;

  return (
    <div className="app">
      <main className="view-container">
        {view === "list" && <ListView foodItems={foodItems} list={list} />}
        {view === "shop" && <ShoppingView list={list} stores={stores} />}
        {view === "recipes" && <RecipesView />}
        {view === "settings" && (
          <SettingsView foodItems={foodItems} list={list} stores={stores} />
        )}
      </main>
      <TabBar view={view} onChange={setView} listCount={uncheckedCount} />
    </div>
  );
}
