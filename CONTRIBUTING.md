# Contributing to OpenAPI Playground

Thank you for contributing to a Local-first developer tool for OpenAI-compatible APIs. Prefer focused, reviewable changes that preserve the product’s privacy boundary and do not bundle unrelated formatting or feature work.

## Development setup

Use **Node.js 22** and **pnpm 10**. Install dependencies with `pnpm install`, then start the local development server with `pnpm dev`.

| Command         | Purpose                                         |
| --------------- | ----------------------------------------------- |
| `pnpm check`    | Run strict TypeScript validation.               |
| `pnpm lint`     | Lint source and tests with zero warnings.       |
| `pnpm test`     | Run Vitest unit and integration coverage.       |
| `pnpm test:e2e` | Run Playwright browser regression tests.        |
| `pnpm build`    | Build the static client and production wrapper. |

Run the relevant checks before requesting review. User-facing, interaction, or layout changes should include safe, redacted screenshots where useful.

## Project structure

The domain layer in `client/src/domain/` owns protocol types, provider behavior, error analysis, comparison, diagnostics, and code generation. `client/src/storage/` owns IndexedDB repositories and Web Crypto key protection. `client/src/services/` orchestrates short-lived local secret access, while `client/src/store/` hydrates application state. UI routes live in `client/src/pages/`, shared components in `client/src/components/`, and tests in `tests/`.

Keep provider-specific HTTP behavior in the provider/domain layer, persistence behind repository interfaces, and user-facing failures in the Error Analyzer. Do not bypass these boundaries by placing transport, storage, or credential logic directly in presentation components.

## Code style and testing

Use TypeScript, existing repository conventions, and the Precision Teal workbench design system. Avoid unrelated dependency upgrades or generated-file changes. Add or update tests when behavior changes, including safe error paths and Local-first boundaries. Test fixtures must use placeholders, never real credentials or private request content.

## Pull requests

Use the pull request template. Explain what changed and why, list validation steps, include redacted screenshots for visual changes, and keep the diff focused. A reviewer should be able to verify TypeScript, lint, unit, E2E, build, security, and scope checks without a real API key.

## Security

Never place real API keys, tokens, Authorization headers, cookies, private prompts, private responses, or diagnostic exports in source code, fixtures, URLs, logs, screenshots, commits, issues, or pull requests. Use `YOUR_API_KEY` or `[REDACTED]` instead. Follow [SECURITY.md](SECURITY.md) for private vulnerability reporting.
