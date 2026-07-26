# Inköpslistan (shoppingAssistant)

A mobile-friendly grocery shopping app for the family, built as an Azure Static Web App.

## Features

- **Shared shopping list** — every activated device sees and edits the same list, synced by polling.
- **Food database with autocomplete** — every item has a category and a default unit (st/pcs, g, kg, l, dl, förp/pkg). Adding items is a fast type-ahead search; unknown items prompt for category + unit and are saved for next time. Pre-seeded with ~180 common grocery items.
- **Fractional quantities** — items counted in whole units (st, förp, pcs, pkg) support half and quarter quantities (1/4, 1/2) below 1. Tap the quantity label to type a value directly.
- **Duplicate-purchase protection** — the app tracks when each item was last bought (set when it's ticked off the list) and warns when you try to add something bought in the last few days.
- **Stores with walking order** — add your frequent stores and arrange the produce departments in the order you walk through them. Mark items you know a store doesn't carry.
- **Shopping mode** — pick the store you're in and the list sorts itself along your route. Items missing from that store are flagged. Tap to tick items off; they stay visible with strike-through. Clear checked items after checkout.
- **Recipes** — save named recipes with ingredients from the food database. When cooking, select which ingredients to add to the shopping list, adjust quantities, and add them in one tap.
- **PWA** — installable on the home screen, offline read of the last-known list.
- **i18n** — English (default) and Swedish. Set `APP_LANGUAGE=sv` to deploy in Swedish.

## Architecture

| Layer | Tech |
|---|---|
| Frontend | React 18 + Vite 5 + TypeScript, `vite-plugin-pwa`, no router/UI library |
| API | Azure Functions v4 (Node 22, TypeScript), one file per endpoint |
| Database | Azure Table Storage (`FoodItems`, `Stores`, `ShoppingList`, `DeviceAuth`, `Recipes`) |
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
npm run seed:food     # ~180 grocery items (idempotent)

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

The app deploys to an Azure Static Web App with a linked Functions API and Azure Table Storage, provisioned by Bicep (`infra/main.bicep`) and driven by GitHub Actions (`.github/workflows/deploy.yml`). All deployment targets are configurable — a fork sets a handful of repo Secrets and Variables and never edits the workflow.

### Prerequisites

- An Azure subscription and the [Azure CLI](https://learn.microsoft.com/cli/azure/install-azure-cli) (`az`), with Bicep (`az bicep install`).
- Permission to create an Entra (Azure AD) app registration and assign roles on the resource group.

### 1. Resource group

Create the group; its name must match the `RESOURCE_GROUP` variable below (default `rg-shoppingassistant-prod`):

```bash
az group create --name rg-shoppingassistant-prod --location swedencentral
```

### 2. OIDC login for GitHub Actions

The workflow authenticates to Azure with OIDC (no stored credentials). Create an app registration, add a **federated credential** for this repo, and grant it Contributor on the resource group:

```bash
APP_ID=$(az ad app create --display-name "shoppingassistant-deploy" --query appId -o tsv)
az ad sp create --id "$APP_ID"

# Federated credential — replace OWNER/REPO. Subject must match the branch that deploys.
az ad app federated-credential create --id "$APP_ID" --parameters '{
  "name": "github-main",
  "issuer": "https://token.actions.githubusercontent.com",
  "subject": "repo:OWNER/REPO:ref:refs/heads/main",
  "audiences": ["api://AzureADTokenExchange"]
}'

SUB_ID=$(az account show --query id -o tsv)
az role assignment create --assignee "$APP_ID" --role Contributor \
  --scope "/subscriptions/$SUB_ID/resourceGroups/rg-shoppingassistant-prod"
```

Note the app's **client ID** (`$APP_ID`), your **tenant ID** (`az account show --query tenantId -o tsv`), and **subscription ID** (`$SUB_ID`) for the next step.

### 3. Repo Secrets and Variables

In **Settings → Secrets and variables → Actions**:

**Secrets**

| Secret | Value |
|---|---|
| `AZURE_CLIENT_ID` | app registration client ID |
| `AZURE_TENANT_ID` | tenant ID |
| `AZURE_SUBSCRIPTION_ID` | subscription ID |
| `JWT_SECRET` | ≥32 random bytes — `openssl rand -base64 32`. Signs device tokens; keep it stable (rotating it forces every device to re-activate). |
| `AZURE_STATIC_WEB_APPS_API_TOKEN` | added in step 5 |

**Variables** (all optional — omit to use the defaults):

| Variable | Default | Notes |
|---|---|---|
| `RESOURCE_GROUP` | `rg-shoppingassistant-prod` | must match step 1 |
| `LOCATION` | `swedencentral` | region for storage |
| `SWA_LOCATION` | `westeurope` | Static Web Apps has limited regions; keep separate from `LOCATION` |
| `APP_NAME` | `shoppingassistant` | base name for resources; the SWA is always `swa-${APP_NAME}` |
| `APP_LANGUAGE` | `en` | `en` or `sv` — sets API locale and frontend build language |

### 4. Provision infrastructure

Run the **Deploy Infrastructure & App** workflow manually (Actions → Run workflow) with `deploy_infra: true`. This provisions the storage account, five tables, the Static Web App, and its app settings, then deploys the app.

### 5. Save the deployment token

Grab the SWA deployment token and store it as the `AZURE_STATIC_WEB_APPS_API_TOKEN` secret so subsequent pushes to `main` can deploy:

```bash
az staticwebapp secrets list --name swa-shoppingassistant \
  --resource-group rg-shoppingassistant-prod \
  --query "properties.apiKey" -o tsv
```

From here, **every push to `main` builds, tests, and deploys** the app.

### 6. Seed production data

Seeding runs from your workstation (the scripts aren't packaged into the deploy). Point them at the production storage account:

```bash
export AZURE_STORAGE_CONNECTION_STRING=$(az storage account show-connection-string \
  --resource-group rg-shoppingassistant-prod \
  --name <storageAccountName> --query connectionString -o tsv)

npm run seed:codes    # prints one-time activation codes
npm run seed:food     # ~180 grocery items (idempotent)
```

The storage account name is generated (`st…` + a hash); find it with `az storage account list -g rg-shoppingassistant-prod --query "[].name" -o tsv`. **If `AZURE_STORAGE_CONNECTION_STRING` is unset the scripts silently seed the local Azurite emulator instead** — export it first.

### Forking / renaming

Beyond the repo Variables above, personalize:

- `frontend/src/components/ActivationGate.tsx` — the device-name placeholder.
- `frontend/vite.config.ts` and `frontend/index.html` — PWA name, title, theme color.

### Managing devices and codes

- **Revoke a device**: in Azure Storage Explorer, open the `DeviceAuth` table, find the row in the `device` partition, set its `status` to `revoked`. The per-request check rejects it on the next call.
- **New activation codes**: re-run `npm run seed:codes` (against production, per step 6). Codes are single-use and printed only once — store them securely.

Secrets live only in GitHub Actions secrets and Azure app settings — never in the repo.
