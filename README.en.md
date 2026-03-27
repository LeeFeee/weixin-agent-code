# weixin-agent-code

An OpenClaw plugin that turns WeChat into a unified interface for multiple AI Coding Agents.

Chat with Claude Code, Codex, OpenCode, GitHub Copilot, Auggie, and Cursor directly from WeChat — no terminal needed.

## How It Works

```
WeChat ←→ OpenClaw Gateway ←→ weixin-agent-code ←→ AI Agent
```

This plugin runs as an OpenClaw channel plugin, leveraging the WeChat channel capabilities provided by `@tencent-weixin/openclaw-weixin` (long-polling message reception, text/image/video/file sending, typing status, etc.) and adds a **multi-backend routing layer** on top that dispatches WeChat messages to different AI Coding Agents.

Two backend modes are supported:

- **openclaw mode**: Uses OpenClaw's full Agent routing pipeline with complete session management, tool calls, and all built-in capabilities.
- **lightweight mode**: Connects directly to CLI Agents via ACP (Agent Communication Protocol) over subprocess stdio. Lightweight and stable, ideal for single-agent conversations.

## Supported Backends

| Backend | Mode | Description | ACP Command |
|---------|------|-------------|-------------|
| OpenClaw | openclaw | Built-in OpenClaw Agent, full pipeline | — |
| Claude Code | lightweight | Anthropic Claude Code CLI | `claude-agent-acp` |
| Codex | lightweight | OpenAI Codex CLI | `codex-acp` |
| OpenCode | lightweight | OpenCode CLI | `opencode acp` |
| GitHub Copilot | lightweight | GitHub Copilot CLI | `copilot --acp --stdio` |
| Auggie | lightweight | Auggie CLI | `auggie --acp` |
| Cursor | lightweight | Cursor Agent CLI | `cursor-agent acp` |

## Prerequisites

- [Node.js](https://nodejs.org/) 22+
- [OpenClaw](https://github.com/openclaw/openclaw) >= 2026.3.23

The installer handles automatically:
- [@tencent-weixin/openclaw-weixin](https://www.npmjs.com/package/@tencent-weixin/openclaw-weixin) >= 2.0.0 (peerDependency)

## Installation

```bash
npx -y @leefeee/weixin-agent-code install
```

The installer automatically performs the following steps:

1. Checks OpenClaw version (requires >= 2026.3.23)
2. Installs the plugin into OpenClaw
3. Disables the official openclaw-weixin plugin (avoids channel conflict)
4. Enables this plugin
5. Guides you through WeChat QR code login
6. Restarts the Gateway

Once installed, open WeChat and start chatting.

## Usage

### Switching AI Backends

Send a slash command in your WeChat conversation to switch backends:

```
/claude       Switch to Claude Code
/codex        Switch to Codex
/opencode     Switch to OpenCode
/copilot      Switch to GitHub Copilot
/auggie       Switch to Auggie
/cursor       Switch to Cursor
/openclaw     Switch to OpenClaw (default)
```

Or use `/backend` to check or manually set the backend:

```
/backend              Show current backend
/backend claude       Switch to Claude Code
```

Backend selection is persisted per-user and automatically restored in subsequent conversations.

### Other Commands

| Command | Description |
|---------|-------------|
| `/echo <message>` | Reply directly without going through AI |
| `/toggle-debug` | Toggle debug mode (shows request timing when enabled) |

### Using Lightweight Backends

Lightweight backends (claude/codex/etc.) require the corresponding CLI tool installed locally with ACP support:

```bash
# For example, to use Claude Code
npm install -g @zed-industries/claude-agent-acp
claude-agent-acp   # Complete login and trust configuration first
```

Each backend's ACP CLI tool must be available in the system PATH. The plugin spawns a subprocess automatically on first use.

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `WEIXIN_CLAUDE_ACP_BIN` | Claude ACP binary path | `claude-agent-acp` |
| `WEIXIN_CODEX_ACP_BIN` | Codex ACP binary path | `codex-acp` |
| `WEIXIN_OPENCODE_ACP_BIN` | OpenCode ACP binary path | `opencode` |
| `WEIXIN_COPILOT_ACP_BIN` | Copilot ACP binary path | `copilot` |
| `WEIXIN_AUGGIE_ACP_BIN` | Auggie ACP binary path | `auggie` |
| `WEIXIN_CURSOR_ACP_BIN` | Cursor ACP binary path | `cursor-agent` |
| `WEIXIN_{BACKEND}_ACP_CWD` | Working directory for the backend | Current working directory |
| `WEIXIN_{BACKEND}_ACP_PERMISSION_MODE` | Permission mode (`auto` to allow all / `cancel` to deny all) | `auto` |
| `OPENCLAW_LOG_LEVEL` | Log level | `INFO` |

### OpenClaw Configuration

Set per-account custom parameters in `openclaw.json`:

```json
{
  "channels": {
    "weixin-agent-code": {
      "enabled": true,
      "accounts": {
        "<accountId>": {
          "name": "My Bot",
          "baseUrl": "https://ilinkai.weixin.qq.com",
          "cdnBaseUrl": "https://novac2c.cdn.weixin.qq.com/c2c"
        }
      }
    }
  }
}
```

## Data Storage

All data is stored under `~/.openclaw/openclaw-weixin/`:

```
~/.openclaw/openclaw-weixin/
├── accounts/              # WeChat account credentials (token, baseUrl)
├── backend-selection.json # Per-user backend selection records
├── debug-mode.json        # Debug mode toggle state
└── *.sync.json           # Message sync buffers
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Output is in the dist/ directory
```

## Acknowledgements

This project's architecture and design draw inspiration from the following open-source projects:

- [OpenClaw](https://github.com/openclaw/openclaw) — Plugin framework and Gateway runtime
- [@tencent-weixin/openclaw-weixin](https://www.npmjs.com/package/@tencent-weixin/openclaw-weixin) — WeChat channel capabilities (message send/receive, media encryption, login auth)
- [Agent Client Protocol (ACP)](https://github.com/AcpProtocol/acp) — Agent communication protocol
- [@agentclientprotocol/sdk](https://www.npmjs.com/package/@agentclientprotocol/sdk) — Official ACP protocol SDK
- [BytePioneer-AI/weixin-agent-gateway](https://github.com/BytePioneer-AI/weixin-agent-gateway) — Reference implementation for multi-backend routing and ACP integration

## License

MIT
