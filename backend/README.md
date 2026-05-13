# BriefAI — Backend API

NestJS service for the **Brief to Jira-style tickets** flow: upload briefs (PDF, Word, text), run OpenAI for clarifying questions and ticket generation, and persist briefs and tickets in MongoDB.

## Stack

- **NestJS** 11
- **MongoDB** + **Mongoose**
- **OpenAI** (chat completions, JSON responses)
- **Multer** (multipart uploads, in-memory storage)
- **pdf-parse** (PDF text), **mammoth** (DOC/DOCX)

## Prerequisites

- Node.js 20+ (LTS recommended)
- MongoDB reachable from this machine
- An [OpenAI API key](https://platform.openai.com/api-keys)

## Environment variables

Copy the example file and edit values:

```bash
cp .env.example .env
```

| Variable     | Description |
|-------------|-------------|
| `PORT`      | HTTP listen port (defaults to **4000** in code if unset). |
| `NODE_ENV`  | `development` or `production`. |
| `MONGO_URI` | MongoDB connection URI (required). |
| `API_KEY`   | OpenAI API key (required for AI features). |
| `MODEL`     | OpenAI model id (defaults to `gpt-4o-mini` if unset). |

See [.env.example](.env.example) for a template. **Never commit `.env`** — it is gitignored.

## Install and run

```bash
npm install
npm run start:dev
```

The API listens on `http://localhost:<PORT>` with a global prefix **`/api/v1`**.

Examples:

- `POST http://localhost:4000/api/v1/brief/upload` — multipart field **`files`**
- `POST http://localhost:4000/api/v1/brief/:id/answers` — JSON `{ "answers": string[] }`
- `GET  http://localhost:4000/api/v1/brief/history`
- `GET  http://localhost:4000/api/v1/brief/:id`

CORS is enabled for browser clients (`origin: true`).

## Scripts

| Command            | Description |
|--------------------|-------------|
| `npm run start`    | Start once (no watch). |
| `npm run start:dev`| Watch mode for development. |
| `npm run start:prod`| Run compiled output from `dist/`. |
| `npm run build`    | Compile TypeScript to `dist/`. |
| `npm run lint`     | ESLint. |
| `npm run test`     | Unit tests. |
| `npm run test:e2e` | E2E tests (Jest; ensure env matches your setup). |

## Project layout (high level)

- `src/config/` — `app`, `database`, `openai` config factories
- `src/modules/brief/` — upload, extraction, OpenAI flows, REST controller
- `src/modules/tickets/` — ticket schema and persistence
- `src/openai/` — global OpenAI client provider
- `src/database/` — Mongoose root connection

## License

Private / unlicensed unless otherwise specified by the repository owner.
