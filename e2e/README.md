# E2E Test Auth Setup

The **authenticated** Playwright project requires a stored session at
`e2e/.auth/user.json`. This file is **gitignored** — you must generate it locally.

## Why manual setup?

The app uses **Google OAuth** exclusively. Playwright cannot automate the
Google consent screen. Instead, you capture a real session once and reuse it.

## Steps

1. **Sign in manually** in your browser at `http://localhost:3000/login`.
2. **Open DevTools → Application → Cookies** and copy the `sb-*` Supabase
   session cookies.
3. Run the helper script (or create `e2e/.auth/user.json` by hand):

```bash
node e2e/setup/save-auth.mjs
```

The generated JSON has the shape Playwright expects for `storageState`:

```json
{
  "cookies": [
    { "name": "sb-access-token", "value": "...", "domain": "localhost", "path": "/", "httpOnly": true, "secure": false, "sameSite": "Lax" },
    { "name": "sb-refresh-token", "value": "...", "domain": "localhost", "path": "/", "httpOnly": true, "secure": false, "sameSite": "Lax" }
  ],
  "origins": []
}
```

4. Run only the authenticated tests:

```bash
npx playwright test --project=authenticated
```

## Running unauthenticated tests

No setup required — just start the dev server and run:

```bash
npm run dev &
npx playwright test --project=unauthenticated
```
