# Architecture

OpenAPI Playground remains a single Vite + React package. Its Phase 3 boundaries are explicit: page components own interaction state; the store hydrates and persists non-sensitive workspace data; the service layer obtains a decrypted secret only for the active operation; the Provider adapter normalizes OpenAI-compatible HTTP and SSE; and IndexedDB holds metadata, history, settings, encrypted secret payloads, and the browser-managed master key separately.

```text
Pages → Zustand store → Provider service → OpenAI-Compatible adapter → User-selected Provider
  │           │                  │
  │           ├─ Provider / Request / Settings repositories → IndexedDB
  │           └─ Secret repository → AES-GCM payloads in IndexedDB
  │
  └─ Response Inspector / History / Code Generator / Error Analyzer
```

The browser makes a direct request to the selected Provider. There is no project backend, user account, shared proxy, server database, or cloud credential store. If the Provider blocks cross-origin browser requests, the Error Analyzer surfaces the limitation instead of routing the key elsewhere.

The OpenAI-Compatible adapter has `testConnection`, `listModels`, `chat`, `streamChat`, `normalizeError`, and `getModelInfo` capabilities. It reads `GET /models` when supported, allows manual model entry when it is not, sends standard `POST /chat/completions` JSON, and parses compatible `data:` SSE events incrementally.
