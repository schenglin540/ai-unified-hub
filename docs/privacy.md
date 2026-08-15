# Privacy and Local-first Boundaries

OpenAPI Playground stores Provider metadata, settings, and request history in IndexedDB. API keys are not included in Provider metadata, request records, source code, generated snippets, URLs, analytics, raw error displays, screenshots, or test fixtures. Before an API key is persisted, the Secret Repository encrypts it using AES-GCM via the browser Web Crypto API. The key is only retrieved into short-lived application memory when a direct Provider call is made.

The application does not send keys to OpenAPI Playground servers because this static version has no API route or cloud proxy. In direct mode, a request travels from the browser to the Provider selected by the user. The app cannot guarantee that the Provider supports browser cross-origin calls; CORS and network failures are surfaced as explicit diagnostics, with no hidden fallback.

> Local-first does not mean absolute security. A compromised device, malicious browser extension, or malicious code in the page can still access data available to the browser. Use scoped, rotatable keys and revoke them if exposure is suspected.

Clearing or deleting a Provider removes its local metadata and corresponding encrypted secret. Clearing history removes stored request records only; API keys are never contained in those records.
