# Changelog

## v0.2.0 (2026-05-24)

### Security Fixes
- **macOS hardening**: `hardenedRuntime: true`, `gatekeeperAssess: true` in `electron-builder.yml`
- **Renderer sandbox**: `sandbox: true` in `webPreferences`
- **Crash logs**: stack traces sanitized (api_key, token, secret masked)
- **NapCatQQ download**: file size verification + SHA256 checksum validation (when provided)
- **Docker**: image digest pinning note in `wechat-manager.ts`

### Bug Fixes
- **Renderer import**: `QuickStartStep.tsx` now imports from local `src/core/role-templates` instead of npm package (fixes build)
- **Scheduler**: cron callbacks wrapped in try-catch
- **Config**: empty config updates rejected by Zod schema
- **IPC**: stale `chat:export` channel removed from handler allowlist
- **Channels**: handler-utils and preload channel lists synchronized

## v0.1.1 (2026-05-23)
- Security audit fixes

## v0.1.0 (2026-05-16)
- Initial Electron build with AI companion engine
