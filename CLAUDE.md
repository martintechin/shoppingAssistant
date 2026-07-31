# CLAUDE.md

Developer/agent brief for shoppingAssistant. This is the authoritative doc; keep it current.

## What this is

Mobile-first grocery shopping PWA for one family: React 18 + Vite frontend, Azure Functions v4 (Node 22, TS) API, Azure Table Storage, deployed as an Azure Static Web App.

## Commands

| Command | What |
|---|---|
| `npm run dev:api` | Build + `func start` on :7071 (needs Azurite + `api/local.settings.json`) |
| `npm run dev:frontend` | Vite dev server on :3004, proxies `/api` → :7071 |
| `npm test` / `npm run test:api` / `npm run test:frontend` | vitest suites |
| `npm run build` | tsc build of both packages (frontend also `vite build`) |
| `npm run seed:codes` | Create one-time activation codes (arg = count, default 3) |
| `npm run seed:food` | Idempotent seed of ~180 food items (set `SEED_LANGUAGE=sv` for Swedish, default English) |

## Shared types — edit ONLY `shared/types.ts`

`api/src/types/shared.ts` and `frontend/src/types/shared.ts` are committed **copies**, refreshed automatically by each package's `sync-types` script (runs on prebuild/predev/pretest). Never edit the copies.

## Data model (Azure Table Storage)

Arrays are JSON-stringified strings; timestamps are ISO strings; row keys are `${Date.now()}-${random}`.

- **FoodItems** (pk `item`): `name`, `nameLower` (locale-aware lowercase via `APP_LOCALE`, for duplicate checks — recompute on rename!), `category`, `unit`, `lastBought?`, `createdAt`.
- **Stores** (pk `store`): `name`, `categoryOrder` (JSON string[] — the walking route), `unavailableItems` (JSON string[] of FoodItems row keys), `createdAt`.
- **ShoppingList** (pk `list`, single partition so `submitTransaction` batch-deletes work): `foodItemId`, denormalized `name`/`category`/`unit`, `quantity`, `checked`, `addedAt`, `checkedAt?`, `prevLastBought?`.
- **Recipes** (pk `recipe`): `name`, `ingredients` (JSON array of `{ foodItemId, quantity }`), `createdAt`, `lastAddedToList?` (ISO, `""` = unset sentinel).
- **DeviceAuth**: partitions `code` (activation codes), `device` (revocable devices), `ratelimit` (IP windows).

## Key behaviors & invariants

- **lastBought**: set on the food item when a list row is *checked*; the previous value is snapshotted to the row's `prevLastBought` and restored on *uncheck* (mis-tap protection). Merge can't delete properties, so `""` is the unset sentinel for `lastBought`/`checkedAt`/`prevLastBought`.
- **addListItem** denormalizes name/category/unit server-side and *merges* into an existing unchecked row for the same `foodItemId` (quantity bump, `merged: true`) — concurrent adds from two devices converge.
- **categoryOrder is never validated against `CATEGORIES` server-side.** New config categories are reconciled client-side: appended at sort time (`utils/sorting.ts`) and merged into the editor when a store is edited (`StoreForm.initialOrder`).
- **Deleting a food item** eagerly strips it from every store's `unavailableItems`; shopping-list rows survive on their denormalized copies (stale name after rename is accepted).
- Recently-bought warning (`RECENTLY_BOUGHT_DAYS = 4` in `frontend/src/config.ts`) is based on ≤60s-stale polled data — accepted.
- **lastAddedToList**: stamped server-side on the recipe (via `updateRecipe` with `markAddedToList: true`) after `RecipeDetail` pushes ingredients onto the list, so "which dishes have we shopped for" survives device clock skew. Shown on every recipe card and in the detail header; drives the **Recent** sort in `RecipesView` (`sortRecipes()` in `utils/sorting.ts` — never-added recipes sink to the bottom alphabetically). The chosen sort mode (`alpha` | `recent`) is persisted in localStorage.
- **Quantity stepping**: units with base step 1 (st/pcs, förp/pkg) support fractional quantities below 1 — the sequence is 1/4, 1/2, 1, 2, 3, … The quantity label is tappable for direct numeric entry in list items and recipes. Logic lives in `stepQuantity()` in `frontend/src/config.ts`.

## Language / i18n

English is the default language. Set GitHub repo variable `APP_LANGUAGE=sv` to deploy in Swedish. The variable flows through Bicep → SWA app setting (for the API's `APP_LOCALE`) and as `VITE_LANGUAGE` build-time env var (for the frontend).

- **Frontend**: `frontend/src/i18n/` contains `en.ts`, `sv.ts` (language files) and `index.ts` (exports `t()`, `LOCALE`, `CATEGORIES`, `UNITS`, etc.). All UI strings use `t("key")` with optional `{param}` interpolation. Categories, units, category colors, and unit steps are language-specific.
- **API**: `api/src/locale.ts` derives `APP_LOCALE` from `process.env.APP_LANGUAGE`. Used for `toLocaleLowerCase()` in `storeFoodItem`/`updateFoodItem`.
- **Seed data**: `api/scripts/food-data-en.ts` and `food-data-sv.ts`. The seed script reads `SEED_LANGUAGE` (default `"en"`) to pick the right file. Categories and units in seed data match the language files.
- **shared/types.ts** does not define `CATEGORIES` or `UNITS` — these are language-dependent and live in the i18n layer.

## API conventions

One self-contained file per endpoint in `api/src/functions/`, registered by side-effect import in `api/src/index.ts`. Handler shape: `verifyRequest` → 401 · parse/validate (type-guard, specific 400 messages) · try/catch → generic 500 (never leak internals). `authLevel: "anonymous"` everywhere — the app's own JWT layer (`api/src/auth.ts`, `X-Auth-Token` header) is the sole gate; SWA roles are unused. Escape every interpolated OData filter value with `escapeOData`.

Endpoints: `activate`, `getFoodItems`/`storeFoodItem`/`updateFoodItem`/`deleteFoodItem`/`bulkUpdateCategory`, `getStores`/`storeStore`/`updateStore`/`deleteStore`, `getList`/`addListItem`/`updateListItem`/`deleteListItem`/`clearChecked`, `getRecipes`/`storeRecipe`/`updateRecipe`/`deleteRecipe`, `getCodes`/`generateCode`/`deleteCode`, `getDevices`/`revokeDevice`/`renewToken`. `storeFoodItem` returns **409 + `existingId`** on duplicate `nameLower`; the client adds the existing item instead.

## Frontend conventions

- No router: `App.tsx` switches four views (List/Shop/Recipes/Settings) via the bottom `TabBar`; Settings contains sub-views for Foods, Stores, and Device management. Modals are overlays. Data hooks (`useFoodItems`, `useShoppingList`, `useStores`) are instantiated once in `AppShell` (inside the `ActivationGate`) and passed down; they poll every 60s and expose `refresh()`.
- All fetches go through `utils/api.ts` (`authFetch` adds the token, 401 → `auth:expired` event re-gates the app; `apiRequest/apiPost/apiPut/apiDelete` unify error extraction into `ApiError`).
- Autocomplete is **client-side** over the fully-cached food DB (`utils/text.ts`, prefix > substring ranking) — do not add a search endpoint.
- Optimistic updates only for check/uncheck and quantity stepping (via `list.mutate`), revert on failure, silent `refresh()` on 404. Adds/deletes await + refresh.
- Touch rules: ≥44-48px targets, 16px input font (iOS zoom), `dvh` modals, `touch-action: manipulation`, two-click inline confirm for destructive actions (no `window.confirm`).
- `EditableQuantity` component (`frontend/src/components/EditableQuantity.tsx`): tappable quantity label that switches to a numeric input on tap. Used in `ListItemRow`, `RecipeDetail`, and `RecipeForm`.

## Testing

API tests mock `../tableClient.js` with the in-memory `src/testUtils/mockTableClient.ts` (supports the `eq`-filter shapes used) and `../auth.js` inline. `src/testUtils/` and `*.test.ts` are excluded from the tsc build. Frontend: vitest + testing-library, fake timers for date-dependent tests.

## Auth flow

Seed codes offline → user enters code in `ActivationGate` → `POST /api/activate` (IP rate-limited 10/15min) → 1-year HS256 JWT in localStorage → `X-Auth-Token` on every call → per-request revocation check against the `device` partition. Revoke a device by flipping its `status` to `revoked`. Device management (view devices, revoke, generate new codes) is available in the Settings → Devices sub-view.

## Deployment

GitHub Actions (`.github/workflows/deploy.yml`): build+test on PR/push; deploy to SWA via `swa-cli` on push to `main` (needs `AZURE_STATIC_WEB_APPS_API_TOKEN`); PR previews auto-deploy and clean up on close; manual `workflow_dispatch` with `deploy_infra: true` provisions Bicep (needs OIDC secrets + `JWT_SECRET`). Set repo variable `APP_LANGUAGE` to `sv` for Swedish (default English). Local storage emulator is Azurite (`UseDevelopmentStorage=true`). **Never commit secrets, tokens or publish profiles.**
