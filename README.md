# Horo Horo Admin

Web admin panel for the Horo Horo API, built with SvelteKit + TypeScript + Tailwind CSS.

## Features

- Login wall with JWT-based authentication
- Dashboard with user and token activity overview
- Users list with search, pagination, and filtering
- User detail view with profile editing and token management
- Token history log across all users, with "Add Token" dialog
- Dark / light mode
- Three environment targets: dev, staging, prod

---

## Prerequisites

- **Node.js** v18 or later — [nodejs.org](https://nodejs.org)
- **npm** v9 or later (comes with Node)
- The **Horo Horo API** running (locally or pointed to staging)

---

## Getting started (local dev)

### 1. Clone the repo

```bash
git clone <repo-url>
cd horo-horo-admin
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set your API URL

The app reads `VITE_API_URL` from a `.env` file to know which backend to call.

For local development, create `.env.local` (or edit `.env.development`):

```bash
# .env.local
VITE_API_URL=http://localhost:8080
```

Three pre-configured env files are included:

| File | Environment | API URL |
|---|---|---|
| `.env.development` | dev | `http://localhost:8080` |
| `.env.staging` | staging | `https://hora-hora-api-staging-p5v3g7y4zq-as.a.run.app` |
| `.env.production` | prod | *(fill in your prod URL)* |

SvelteKit loads these automatically based on `NODE_ENV`. You can also override any variable in `.env.local` (git-ignored).

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). The app redirects to `/login` if you're not authenticated.

Log in with an account that has the `admin` or `back_office` role in the database.

---

## Build for production

```bash
# Standard build (uses .env.production)
npm run build

# Preview the production build locally
npm run preview
```

## Build targeting staging

```bash
# Load staging env vars, then build
NODE_ENV=staging npm run build
```

Or manually set the variable before building:

```bash
VITE_API_URL=https://hora-hora-api-staging-p5v3g7y4zq-as.a.run.app npm run build
```

---

## Project structure

```
src/
├── app.css                  # Tailwind CSS entry point
├── app.html                 # HTML shell
├── lib/
│   ├── api.ts               # API client (all fetch calls)
│   ├── auth.svelte.ts       # Auth state store (Svelte 5 runes)
│   ├── env.ts               # VITE_API_URL helper
│   └── types.ts             # TypeScript types
└── routes/
    ├── +layout.svelte       # Root layout (theme init)
    ├── +page.svelte         # Root redirect (→ /login or /dashboard)
    ├── login/
    │   └── +page.svelte     # Login page
    └── (app)/               # Protected app shell
        ├── +layout.svelte   # Sidebar + auth guard
        ├── dashboard/       # Dashboard overview
        ├── users/
        │   ├── +page.svelte         # User list with search
        │   └── [uid]/+page.svelte   # User detail + edit + token history
        └── token-history/
            └── +page.svelte         # Global token history + Add Token dialog
```

---

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | Yes | Base URL of the Horo Horo API (no trailing slash) |

---

## Authentication

The admin panel authenticates via `POST /api/v1/auth/login` (email + password). The returned JWT is stored in `localStorage` and sent as `Authorization: Bearer <token>` on every subsequent request.

Only users with `role = admin` or `role = back_office` can access the admin API endpoints. The API enforces this server-side; the frontend redirects to `/login` if the token is missing or a 401/403 is returned.
