# Changelog

All notable changes to this project are documented in this file. The repository follows the spirit of [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) while the first public release is prepared.

## [Unreleased]

### Added

- Feature freeze for the local-first OpenAI-compatible Provider workbench, including Playground, Compare, Diagnostics, History, Saved Prompts, Workspace Import/Export, Settings, themes, and keyboard shortcuts.
- Completed browser-direct Provider requests, IndexedDB persistence, AES-GCM Web Crypto key protection, streaming and cancellation, history, Prompt Library, code generation, parallel model comparison, and local Developer Diagnostics.
- Added Release Candidate navigation, keyboard, mobile-overflow, and visible-focus regression coverage.

### Changed

- Removed unused `axios`, `nanoid`, and `recharts` template dependencies and the unused chart component.
- Added route-level lazy loading to reduce the primary JavaScript asset while preserving the established workbench routes.

### Security

- Applied minimal security dependency overrides. The production dependency audit now reports 0 known advisories.
- Removed the template analytics script so the static client does not load an undeclared telemetry endpoint.

### Known non-blocking issue

- Vite still reports one initial chunk larger than its 500 kB warning threshold. The RC uses route-level code splitting; further manual chunking is deferred to avoid unnecessary risk during feature freeze.
