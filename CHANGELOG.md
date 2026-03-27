# Changelog

## [1.1.1] - 2026-03-28

### Fixed
- Cleaned stale AgentAPI compiled files from dist/ directory
- Improved subprocess lifecycle: all ACP instances now dispose on process exit/SIGTERM
- Added SIGKILL escalation (5s timeout) when SIGTERM fails to terminate subprocess
- Clear conversationTasks in resetState() to avoid stale promise chains
- Added security documentation for `shell:true` on Windows

### Changed
- Removed AgentAPI residual code from CLI installer (cli.mjs)

## [1.1.0] - 2026-03-28

### Changed
- **Breaking**: Replace AgentAPI (HTTP-based Go binary proxy) with ACP (Agent Communication Protocol) direct subprocess communication via `@agentclientprotocol/sdk`
- Lightweight backends now spawn CLI agents as child processes over stdio/NDJSON instead of connecting through AgentAPI HTTP endpoints

### Added
- `AcpSubprocessLightweightClient` — unified ACP subprocess client with session management, conversation queuing, permission auto-approval, and image output handling
- Per-backend ACP client classes with configurable command, args, and environment variables

### Removed
- `agentapi-client.ts` and `agentapi-launcher.ts` — AgentAPI HTTP client and launcher
- All `WEIXIN_*_AGENTAPI_URL`, `AGENTAPI_AUTOSTART`, `AGENTAPI_BIN` environment variables

### Migration
- Environment variables renamed from `WEIXIN_{BACKEND}_AGENTAPI_URL` to `WEIXIN_{BACKEND}_ACP_BIN` (binary path instead of HTTP URL)
- New optional env vars: `WEIXIN_{BACKEND}_ACP_CWD` (working directory), `WEIXIN_{BACKEND}_ACP_PERMISSION_MODE` (`auto`/`cancel`)

## [1.0.0] - 2026-03-27

### Added
- Initial release
- Multi-backend support: OpenClaw, Claude Code, Codex, OpenCode, GitHub Copilot, Auggie, Cursor
- AgentAPI lightweight mode with auto-launch
- Slash commands for backend switching
- One-click install via `npx -y @leefeee/weixin-agent-code install`
- Context token based conversation continuity
- Typing status indicator
- Debug mode with timing statistics
- Backend selection persistence
- AES-128-ECB encrypted media upload/download
- Long-polling message monitoring
