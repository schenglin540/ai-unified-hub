# v1.0.0 — Draft Release Notes

> This is a release-notes draft, not a published GitHub Release. Publish it only after the repository owner creates the remote, confirms the CI run, and selects the final release tag.

OpenAPI Playground v1.0.0 introduces a Local-first workbench for testing OpenAI-compatible chat APIs directly from the browser.

## Highlights

- **Playground:** multi-role chat-completion requests, compatible SSE streaming, stop, retry, request/response inspection, metrics, history, saved prompts, and portable code generation.
- **Model Compare:** shared prompts across two or three locally configured targets, parallel runs, independent streaming controls, TTFT/latency/token readouts, side-by-side responses, diffs, and saved comparisons.
- **Developer Diagnostics:** safe local analysis for HTTP, authentication, rate-limit, network, CORS, invalid-model, context-length, streaming, and malformed-response failures; provider health; and sanitized JSON, text, and Markdown exports.
- **Local-first security boundary:** browser-local IndexedDB workspace data, AES-GCM Web Crypto credential protection, no shared API-key proxy, and secrets excluded from supported histories, diagnostics, exports, screenshots, and reports.
- **Repository foundation:** Node 22 CI, TypeScript/lint/unit/E2E/build checks, Issue Forms, Pull Request template, security policy, contribution guide, and public presentation assets.

## Verification

The release candidate passed TypeScript, zero-warning lint, 37 Vitest tests, 10 Playwright E2E scenarios, production build, production dependency audit with 0 advisories, credential audit, and Git audit.

## Known non-blocking item

Vite continues to report one JavaScript chunk above its default warning threshold. Route-level code splitting is in place; further manual chunking is deferred to avoid behavior risk at v1.0.0 preparation.
