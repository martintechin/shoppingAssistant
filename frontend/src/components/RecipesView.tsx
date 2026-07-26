import { t } from "../i18n";

export function RecipesView() {
  return (
    <div className="recipes-view">
      <div className="view-header">
        <h1>{t("recipes.title")}</h1>
      </div>
      <div className="empty-state">{t("recipes.placeholder")}</div>
    </div>
  );
}
