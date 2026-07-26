# Preparing to make this repo public

A one-time checklist to run **before** flipping the repository to public. It protects the
existing personal instance and makes the history clean for others. Do these in order.

## 1. Rotate the JWT signing secret

The repo now documents the exact token shape (HS256, `deviceId`/`iss`/`aud` claims,
`X-Auth-Token` header). If the deployed `JWT_SECRET` is weak, low-entropy, or was ever set to the
local placeholder (`local-dev-secret-change-in-production`), anyone reading the source could forge
tokens. Rotate it to a strong value:

```bash
openssl rand -base64 32
```

Set it as the `JWT_SECRET` repo secret, then re-run the **Deploy Infrastructure & App** workflow
with `deploy_infra: true` (the secret is only written to the app during an infra deploy).

**This invalidates every existing device token** — all devices must re-activate. Seed fresh
codes (`npm run seed:codes` against production) and hand them out.

> The issuer/audience binding added to the JWT also invalidates any pre-existing tokens, so the
> re-activation above covers that change too.

## 2. Scrub the old deployment hostname from git history

Early history contains a workflow file whose **name** leaks the deployed hostname:
`.github/workflows/azure-static-web-apps-lively-river-0b505ad03.yml` (added in commit `6e014f9`,
later deleted). The file is gone from `HEAD` but recoverable from history. A hostname isn't a
secret, but scrubbing it removes a free "attack this exact URL" pointer.

Rewriting history changes **every commit hash** and requires a force-push; collaborators must
re-clone. Do it on a fresh clone, ideally right before going public.

Using [`git filter-repo`](https://github.com/newren/git-filter-repo) (recommended):

```bash
git filter-repo --path .github/workflows/azure-static-web-apps-lively-river-0b505ad03.yml --invert-paths
```

Fallback if `git filter-repo` isn't installed:

```bash
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch .github/workflows/azure-static-web-apps-lively-river-0b505ad03.yml' \
  --prune-empty --tag-name-filter cat -- --all
```

Verify nothing remains, then force-push all refs:

```bash
git log --all --name-only --pretty=format: | grep lively-river   # expect no output
git push --force-with-lease origin --all
git push --force-with-lease origin --tags
```

## 3. Confirm secrets and variables are set

Follow the **Deployment** section of the README so the public workflow works for you and forkers:
Secrets (`AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID`, `JWT_SECRET`,
`AZURE_STATIC_WEB_APPS_API_TOKEN`) and Variables (`RESOURCE_GROUP`, `LOCATION`, `SWA_LOCATION`,
`APP_NAME`, `OWNER_TAG`).

## 4. Verify the security headers are live

`staticwebapp.config.json` now ships from `frontend/public/` into the deployed artifact. After a
deploy, confirm the headers are actually served:

```bash
curl -sI https://<your-site>.azurestaticapps.net | grep -iE "content-security-policy|strict-transport-security|x-frame-options"
```

All three should be present.
