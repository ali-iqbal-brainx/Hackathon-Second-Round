# BriefAI — Frontend

React client for **Brief to Jira-style tickets**: upload briefs, answer AI clarifying questions, review generated tickets, export PDFs, and browse history.

## Stack

- **React** 19 + **TypeScript**
- **Vite** 8
- **Tailwind CSS** 4
- **React Router** 7
- **TanStack React Query** 5
- **Axios**
- **jsPDF** (ticket PDF export)
- **react-hot-toast** (notifications)

## Prerequisites

- Node.js 20+ (LTS recommended)
- Backend API running (see [../backend/README.md](../backend/README.md)) — default base URL assumes port **4000** and path **`/api/v1`**.

## Environment variables

Copy the example file and point the app at your API:

```bash
cp .env.example .env
```

| Variable            | Description |
|---------------------|-------------|
| `VITE_API_URL`     | Full API root, e.g. `http://localhost:4000/api/v1` (**recommended**). |
| `VITE_API_BASE_URL`| Optional fallback if `VITE_API_URL` is not set (same format). |

If neither is set, the app defaults to `http://localhost:4000/api/v1`.

Vite only exposes variables prefixed with `VITE_`. **Restart `npm run dev`** after changing `.env`.

See [.env.example](.env.example) for a template. **Never commit `.env`** — it is gitignored.

## Install and run

```bash
npm install
npm run dev
```

Then open the printed local URL (usually `http://localhost:5173`).

Ensure the backend URL in `.env` matches where Nest is listening and includes the **`/api/v1`** prefix.

## Scripts

| Command           | Description |
|-------------------|-------------|
| `npm run dev`     | Vite dev server with HMR. |
| `npm run build`   | Typecheck + production build to `dist/`. |
| `npm run preview` | Serve the production build locally. |
| `npm run lint`    | ESLint. |

## Project layout (high level)

- `src/config/` — routes, constants (including API base URL resolution)
- `src/lib/` — Axios instance, React Query client
- `src/features/brief/` — brief API, hooks, upload UI pieces, history card
- `src/features/tickets/` — ticket types and ticket card UI
- `src/shared/utils/` — shared helpers (e.g. PDF generation)
- `src/pages/` — route-level screens
- `src/router/` — `AppRouter`
- `src/components/` — layout, error boundary, step indicator, etc.

## License

Private unless otherwise specified by the repository owner.
