# Security Policy

## Reporting a vulnerability

Please **do not** report suspected vulnerabilities in a public issue or discussion. When the repository is hosted on GitHub with private vulnerability reporting enabled, use the repository’s **Security** tab and select **Report a vulnerability** to open a GitHub Security Advisory draft.

Include a minimal, credential-free reproduction, the affected version or commit, impact, and any safe mitigation notes. Do not include API keys, Authorization headers, tokens, cookies, private prompts, private responses, diagnostic exports, personal data, or unredacted logs. If private vulnerability reporting is not available for the repository, wait for a maintainer-provided private reporting channel rather than opening a public issue.

## Security boundary

OpenAPI Playground is Local-first by default. Provider metadata, request history, prompts, comparisons, diagnostics, and encrypted credential material remain in the user’s browser. API keys are encrypted at rest using browser Web Crypto and are decrypted locally only while calling a user-selected OpenAI-compatible Provider.

The app does not provide a shared API gateway, cloud credential store, account system, cloud database, analytics endpoint, or universal proxy. Browser-direct requests remain subject to the selected Provider’s security and CORS policies.

## Contributor requirements

Never commit or publish real API keys, credentials, Authorization headers, tokens, cookies, private prompts, private responses, diagnostic exports, screenshots, recordings, or logs. Use clear placeholders such as `YOUR_API_KEY` or `[REDACTED]` in safe examples. Before opening a pull request, run the repository checks and review the diff for accidental secrets.
