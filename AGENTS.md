# Repository Guidelines

## Project Structure & Module Organization

`Frontend/` contains the React/Vite application. Put route-level screens in `Frontend/src/pages/`, reusable UI in `Frontend/src/components/`, API helpers in `Frontend/src/services/`, and images in `Frontend/src/assets/`. `Backend/src/` contains the Express API: routes map requests to controllers, services hold application logic, repositories access PostgreSQL, and middleware validates or authenticates requests. SQL schema and triggers live in `Database/`. Jest suites are grouped by domain under `Tests/` (for example, `Tests/receitaTests/`).

## Build, Test, and Development Commands

Install dependencies at the repository root and in `Frontend/` with `npm install` and `npm --prefix Frontend install`. Run `node Backend/src/index.js` to start the API on port 3000. Run `npm --prefix Frontend run dev` for the Vite development server, `npm --prefix Frontend run build` to check the production bundle, and `npm --prefix Frontend run lint` for Oxlint diagnostics. From the repository root, `npm test -- --runInBand` runs the Jest suite; use `npm test -- --runInBand Tests/receitaTests` to focus on recipes.

## Coding Style & Naming Conventions

Use CommonJS (`require`/`module.exports`) in the backend and ES modules in the frontend. Follow the indentation and quote style of the file you edit; existing files vary. Name React components and their `.jsx` files in PascalCase, such as `PanelNovaCompra.jsx`. Use descriptive domain names for backend modules, such as `receitaController.js` and `receitaRepository.js`. Keep HTTP response handling in controllers and SQL in repositories.

## Testing Guidelines

Add Jest tests as `*.test.js` in the matching `Tests/<domain>Tests/` directory. Cover changed behavior at the appropriate layer; use mocks for isolated tests and Supertest where HTTP behavior matters. Integration tests requiring a database use `TEST_DATABASE_URL` and skip when it is absent. Point it to a separate test database, never the normal `DATABASE_URL`. No coverage threshold is configured.

## Architectural Decisions and Evidence

Avoid unsupported assumptions. Base request formats, function signatures, response shapes, and other architectural decisions on existing code or explicit user requirements. When a necessary decision cannot be verified from either source, ask the user before writing code or tests that depend on it. As an example, do not invent the expected payload for an update function that has not been implemented.

## Commit & Pull Request Guidelines

Prefer the project's conventional commit pattern in Portuguese, using an indicative verb: `feat: adiciona histórico de receitas`, `fix: corrige validação`, or `refactor: separa componentes`. Keep commits focused. In pull requests, explain the behavior changed, affected API routes or screens, tests run, and any remaining integration work. Include screenshots for visible UI changes and link the related issue when one exists.

## Configuration & Secrets

Keep credentials in ignored `.env` files; do not commit database URLs, tokens, or passwords. Check `Backend/src/config/` before changing database configuration, and keep test credentials isolated from development data.

## Pending Work for the Next Sprint

- Replace the client-provided `?usuario_id` used by ingredient PATCH/DELETE with the authenticated session identity. Today a client can impersonate administrator ID 1; add authorization tests for that case.
- Decide how to persist the mapping from standard ingredient names and aliases to ingredient IDs after an administrator renames a standard ingredient. The current static catalog still searches for the old name during purchases.
- Revisit the initial ingredient load: it intentionally seeds only an empty table to preserve renames, so it does not fill a partially populated catalog. Resolve this together with the persistent mapping above.
- Confirm the scope of the recipe update task before implementing it. The existing `PATCH /api/receitas/:id` updates basic fields, does not update recipe ingredients, and currently does not check recipe ownership.
