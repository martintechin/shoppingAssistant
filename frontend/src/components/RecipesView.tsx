import { useMemo, useState } from "react";
import { Recipe } from "../types/shared";
import { UseFoodItemsResult } from "../hooks/useFoodItems";
import { UseShoppingListResult } from "../hooks/useShoppingList";
import { UseRecipesResult } from "../hooks/useRecipes";
import { RecipeSortMode, sortRecipes } from "../utils/sorting";
import { formatRelativeDays } from "../utils/dates";
import { t } from "../i18n";
import { RecipeForm } from "./RecipeForm";
import { RecipeDetail } from "./RecipeDetail";

const SORT_MODE_KEY = "shoppingassistant_recipe_sort";

function readSortMode(): RecipeSortMode {
  return localStorage.getItem(SORT_MODE_KEY) === "recent" ? "recent" : "alpha";
}

interface RecipesViewProps {
  foodItems: UseFoodItemsResult;
  list: UseShoppingListResult;
  recipes: UseRecipesResult;
}

export function RecipesView({ foodItems, list, recipes }: RecipesViewProps) {
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [sortMode, setSortMode] = useState<RecipeSortMode>(readSortMode);

  const selectedRecipe = selectedRecipeId
    ? recipes.recipes.find((r) => r.id === selectedRecipeId) ?? null
    : null;

  const sortedRecipes = useMemo(
    () => sortRecipes(recipes.recipes, sortMode),
    [recipes.recipes, sortMode]
  );

  function selectSortMode(mode: RecipeSortMode) {
    setSortMode(mode);
    localStorage.setItem(SORT_MODE_KEY, mode);
  }

  function openDetail(recipe: Recipe) {
    setSelectedRecipeId(recipe.id);
  }

  function openCreate() {
    setEditingRecipe(null);
    setShowForm(true);
  }

  function openEdit() {
    if (selectedRecipe) {
      setEditingRecipe(selectedRecipe);
      setShowForm(true);
    }
  }

  function handleSaved() {
    recipes.refresh();
  }

  function handleDeleted() {
    setSelectedRecipeId(null);
    recipes.refresh();
  }

  if (selectedRecipe) {
    return (
      <div className="recipes-view">
        <RecipeDetail
          recipe={selectedRecipe}
          foodItems={foodItems}
          list={list}
          onEdit={openEdit}
          onDelete={handleDeleted}
          onAddedToList={() => recipes.refresh()}
          onBack={() => setSelectedRecipeId(null)}
        />
        {showForm && (
          <RecipeForm
            recipe={editingRecipe ?? undefined}
            foodItems={foodItems}
            onSave={handleSaved}
            onClose={() => setShowForm(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="recipes-view">
      <div className="view-header">
        <h1>{t("recipes.title")}</h1>
        <button className="btn-primary btn-small" onClick={openCreate}>
          {t("recipes.new")}
        </button>
      </div>

      {recipes.error && <div className="banner-error">{recipes.error}</div>}

      {recipes.recipes.length > 0 && (
        <div className="recipe-sort-picker" role="group" aria-label={t("recipes.sortLabel")}>
          <button
            className={`sort-chip ${sortMode === "alpha" ? "sort-chip-active" : ""}`}
            aria-pressed={sortMode === "alpha"}
            onClick={() => selectSortMode("alpha")}
          >
            {t("recipes.sortAlphabetical")}
          </button>
          <button
            className={`sort-chip ${sortMode === "recent" ? "sort-chip-active" : ""}`}
            aria-pressed={sortMode === "recent"}
            onClick={() => selectSortMode("recent")}
          >
            {t("recipes.sortRecent")}
          </button>
        </div>
      )}

      {recipes.loading && recipes.recipes.length === 0 ? (
        <div className="empty-state">{t("recipes.loading")}</div>
      ) : recipes.recipes.length === 0 ? (
        <div className="empty-state">{t("recipes.empty")}</div>
      ) : (
        <div className="recipe-list">
          {sortedRecipes.map((recipe) => (
            <button
              key={recipe.id}
              className="recipe-card"
              onClick={() => openDetail(recipe)}
            >
              <span className="recipe-card-text">
                <span className="recipe-card-name">{recipe.name}</span>
                <span className="recipe-card-lastadded">
                  {recipe.lastAddedToList
                    ? t("recipes.lastAdded", {
                        when: formatRelativeDays(recipe.lastAddedToList),
                      })
                    : t("recipes.neverAdded")}
                </span>
              </span>
              <span className="recipe-card-meta">
                {t("recipes.ingredientCount", { count: recipe.ingredients.length })}
              </span>
            </button>
          ))}
        </div>
      )}

      {showForm && (
        <RecipeForm
          recipe={editingRecipe ?? undefined}
          foodItems={foodItems}
          onSave={handleSaved}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
