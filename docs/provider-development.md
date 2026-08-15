# Provider Development

Add a future Provider by implementing `AIProvider`, not by adding vendor logic to a page. The current OpenAI-Compatible implementation is the reference adapter: it validates configuration, tests connection, discovers models, makes a non-streaming chat request, parses compatible SSE events, normalizes errors, and exposes model information.

Provider-specific configuration belongs in `ProviderConfig`: the Base URL, model, optional non-sensitive headers, and metadata. API keys do not belong there. They must use a `SecretRepository` reference and be acquired by the service layer only while the connection test or request executes.

An adapter must keep UI errors safe. It should map status and protocol context into a `ProviderError` with a category, title, description, possible causes, recommended actions, and retryability. It must not return raw Authorization headers, secrets, or unbounded provider payloads in a user-visible error.

Every adapter requires fixture-based tests. Use MSW or an equivalent transport mock for models, standard completions, streaming, malformed responses, HTTP errors, CORS/network failures, and cancellation. Do not use a real API key in automated tests.

