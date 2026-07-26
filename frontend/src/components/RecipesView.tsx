import { useState } from "react";
import { Recipe } from "../types/shared";
import { UseFoodItemsResult } from "../hooks/useFoodItems";
import { UseShoppingListResult } from "../hooks/useShoppingList";
import { UseRecipesResult } from "../hooks/useRecipes";
import { t } from "../i18n";
import { RecipeForm } from "./RecipeForm";
import { RecipeDetail } from "./RecipeDetail";

interface RecipesViewProps {
  foodItems: UseFoodItemsResult;
  list: UseShoppingListResult;
  recipes: UseRecipesResult;
}

export function RecipesView({ foodItems, list, recipes }: RecipesViewProps) {
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);

  const selectedRecipe = selectedRecipeId
    ? recipes.recipes.find((r) => r.id === selectedRecipeId) ?? null
    : null;

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

      {recipes.loading && recipes.recipes.length === 0 ? (
        <div className="empty-state">{t("recipes.loading")}</div>
      ) : recipes.recipes.length === 0 ? (
        <div className="empty-state">{t("recipes.empty")}</div>
      ) : (
        <div className="recipe-list">
          {recipes.recipes.map((recipe) => (
            <button
              key={recipe.id}
              className="recipe-card"
              onClick={() => openDetail(recipe)}
            >
              <span className="recipe-card-name">{recipe.name}</span>
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
