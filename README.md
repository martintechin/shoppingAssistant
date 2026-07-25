# Inköpslistan (shoppingAssistant)

A mobile-friendly grocery shopping app for the family, built as an Azure Static Web App. Same architecture and design as [familyCalendar](https://github.com/martintechin/familyCalendar).

## Features

- **Shared shopping list** — every activated device sees and edits the same list, synced by polling.
- **Food database with autocomplete** — every item has a category and a default unit (st, g, kg, l, dl, förp). Adding items is a fast type-ahead search; unknown items prompt for category + unit and are saved for next time. Pre-seeded with ~150 common Swedish grocery items.
- **Duplicate-purchase protection** — the app tracks when each item was last bought (set when it's ticked off the list) and warns when you try to add something bought in the last few days.
- **Stores with walking order** — add your frequent stores and arrange the produce departments in the order you walk through them. Mark items you know a store doesn't carry.
- **Shopping mode** — pick the store you're in and the list sorts itself along your route. Items missing from that store are flagged "Finns ej här". Tap to tick items off; they stay visible with strike-through. "Rensa avprickade" clears them after checkout.
- **PWA** — installable on the home screen, offline read of the last-known list.

## Architecture

| Layer | Tech |
|---|---|
| Frontend | React 18 + Vite 5 + TypeScript, `vite-plugin-pwa`, no router/UI library |
| API | Azure Functions v4 (Node 22, TypeScript), one file per endpoint |
| Database | Azure Table Storage (`FoodItems`, `Stores`, `ShoppingList`, `DeviceAuth`) |
| Auth | One-time activation codes → 1-year JWT (`jose`), `X-Auth-Token` header |
| Infra | Bicep (storage account + SWA Free tier), GitHub Actions deploy |
| Shared types | `shared/types.ts`, copied into both packages by `sync-types` scripts |

## Local development

Prerequisites: Node 22, [Azurite](https://learn.microsoft.com/azure/storage/common/storage-use-azurite) (`npm i -g azurite`), Azure Functions Core Tools v4 (installed as an optional dependency of `api/`).

```bash
# 1. Install
cd api && npm install && cd ../frontend && npm install && cd ..

# 2. Local settings
cp api/local.settings.json.example api/local.settings.json

# 3. Storage emulator (separate terminal)
azurite --silent --location .azurite

# 4. Seed activation codes and the food database
npm run seed:codes    # prints 3 one-time codes
npm run seed:food     # ~150 Swedish grocery items

# 5. API (separate terminal) — http://localhost:7071
npm run dev:api

# 6. Frontend (separate terminal) — http://localhost:3004, proxies /api
npm run dev:frontend
```

Open http://localhost:3004 and activate with one of the seeded codes.

## Testing

```bash
npm test            # api + frontend
npm run test:api
npm run test:frontend
```

## Deployment

1. Create the resource group, then run the **Deploy Infrastructure & App** workflow manually with `deploy_infra: true` (requires the `AZURE_CLIENT_ID` / `AZURE_TENANT_ID` / `AZURE_SUBSCRIPTION_ID` OIDC secrets and a `JWT_SECRET` secret).
2. Save the Static Web App deployment token as the `AZURE_STATIC_WEB_APPS_API_TOKEN` repo secret.
3. Every push to `main` builds, tests and deploys.
4. Seed production: run the seed scripts with `AZURE_STORAGE_CONNECTION_STRING` pointed at the production storage account.

Secrets live only in GitHub Actions secrets and Azure app settings — never in the repo.
