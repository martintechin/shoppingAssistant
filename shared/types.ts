/**
 * Shared types for shoppingAssistant — the single source of truth.
 * This file is copied into api/src/types/shared.ts and
 * frontend/src/types/shared.ts by each package's sync-types script
 * (wired into prebuild/predev/pretest). Edit ONLY this file.
 */

// Categories and units are plain strings in storage and DTOs. Concrete
// values are language-dependent and live in the i18n layer (frontend) and
// seed data (API). The type aliases below keep call-sites readable.

export interface FoodItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  /** ISO timestamp of the last time this item was ticked off a shopping list */
  lastBought?: string;
  createdAt: string;
}

export interface FoodItemsResponse {
  items: FoodItem[];
}

export interface StoreFoodItemRequest {
  name: string;
  category: string;
  unit: string;
}

export interface StoreFoodItemResponse {
  success: boolean;
  item: FoodItem;
}

export interface UpdateFoodItemRequest {
  id: string;
  name?: string;
  category?: string;
  unit?: string;
}

export interface UpdateFoodItemResponse {
  success: boolean;
  item: FoodItem;
}

export interface ImportFoodItemsRequest {
  items: {
    id?: string;
    name: string;
    category: string;
    unit: string;
  }[];
}

export interface ImportFoodItemsResponse {
  success: boolean;
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
}

export interface Store {
  id: string;
  name: string;
  /** Category labels in the order the departments appear along the walking route */
  categoryOrder: string[];
  /** FoodItem ids known to be unavailable in this store */
  unavailableItems: string[];
  createdAt: string;
}

export interface StoresResponse {
  stores: Store[];
}

export interface StoreStoreRequest {
  name: string;
  categoryOrder: string[];
  unavailableItems?: string[];
}

export interface StoreStoreResponse {
  success: boolean;
  store: Store;
}

export interface UpdateStoreRequest {
  id: string;
  name?: string;
  categoryOrder?: string[];
  unavailableItems?: string[];
}

export interface UpdateStoreResponse {
  success: boolean;
  store: Store;
}

export interface ListItem {
  id: string;
  foodItemId: string;
  /** Denormalized from FoodItems at add time so the row survives item edits/deletes */
  name: string;
  category: string;
  unit: string;
  quantity: number;
  checked: boolean;
  addedAt: string;
  checkedAt?: string;
  note?: string;
}

export interface ListResponse {
  items: ListItem[];
}

export interface AddListItemRequest {
  foodItemId: string;
  quantity?: number;
  note?: string;
}

export interface AddListItemResponse {
  success: boolean;
  item: ListItem;
  /** true when the add was merged into an existing unchecked row (quantity bumped) */
  merged: boolean;
}

export interface UpdateListItemRequest {
  id: string;
  quantity?: number;
  checked?: boolean;
  note?: string;
}

export interface UpdateListItemResponse {
  success: boolean;
  item: ListItem;
}

export interface ClearCheckedResponse {
  success: boolean;
  removedCount: number;
}

export interface BulkUpdateCategoryRequest {
  foodItemIds: string[];
  category: string;
}

export interface BulkUpdateCategoryResponse {
  success: boolean;
  updatedCount: number;
}

export interface ActivateRequest {
  code: string;
  name?: string;
}

export interface ActivateResponse {
  token: string;
  deviceId: string;
  expiresAt: string;
}

export interface Device {
  id: string;
  name: string;
  activatedAt: string;
  lastUsedAt?: string;
  status: "active" | "revoked";
}

export interface DevicesResponse {
  devices: Device[];
}

export interface GenerateCodeResponse {
  code: string;
}

export interface RevokeDeviceRequest {
  deviceId: string;
}

export interface RevokeDeviceResponse {
  success: boolean;
}

export interface RenewTokenResponse {
  token: string;
  expiresAt: string;
}

export interface ActivationCode {
  code: string;
  createdAt?: string;
}

export interface CodesResponse {
  codes: ActivationCode[];
}

export interface DeleteCodeRequest {
  code: string;
}

export interface DeleteCodeResponse {
  success: boolean;
}

// ── Recipes ──

export interface RecipeIngredient {
  foodItemId: string;
  quantity: number;
}

export interface Recipe {
  id: string;
  name: string;
  ingredients: RecipeIngredient[];
  createdAt: string;
}

export interface RecipesResponse {
  recipes: Recipe[];
}

export interface StoreRecipeRequest {
  name: string;
  ingredients: RecipeIngredient[];
}

export interface StoreRecipeResponse {
  success: boolean;
  recipe: Recipe;
}

export interface UpdateRecipeRequest {
  id: string;
  name?: string;
  ingredients?: RecipeIngredient[];
}

export interface UpdateRecipeResponse {
  success: boolean;
  recipe: Recipe;
}
