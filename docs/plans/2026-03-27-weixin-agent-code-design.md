# weixin-agent-code 设计文档

## 概述

基于 OpenClaw 插件系统的微信多后端 AI 网关，解耦微信接入层与后端路由层，统一接入 Claude Code、Codex、OpenCode、GitHub Copilot、Auggie、Cursor 等 AI Coding Agent。

## 架构

```
微信 → openclaw-weixin 2.0.x (微信通道层) → weixin-agent-code (路由层) → 后端
```

## 兼容性

- OpenClaw >= 2026.3.23（硬性要求，安装时检测）
- openclaw-weixin 2.0.x（npm tag: latest）
- Node.js 22.14+

## 后端模式

### openclaw 模式
走 OpenClaw runtime 完整 agent 路由和回复链路。

### lightweight 模式
通过 ACP（Agent Communication Protocol）直接以子进程 stdio 方式连接各 CLI Agent：

```
weixin-agent-code → spawn (stdin/stdout NDJSON) → @agentclientprotocol/sdk → CLI Agent
```

| 后端 | 模式 | ACP 命令 | 环境变量 |
|------|------|----------|----------|
| openclaw | openclaw | N/A | N/A |
| claude | lightweight | `claude-agent-acp` | `WEIXIN_CLAUDE_ACP_BIN` |
| codex | lightweight | `codex-acp` | `WEIXIN_CODEX_ACP_BIN` |
| opencode | lightweight | `opencode acp` | `WEIXIN_OPENCODE_ACP_BIN` |
| copilot | lightweight | `copilot --acp --stdio` | `WEIXIN_COPILOT_ACP_BIN` |
| auggie | lightweight | `auggie --acp` | `WEIXIN_AUGGIE_ACP_BIN` |
| cursor | lightweight | `cursor-agent acp` | `WEIXIN_CURSOR_ACP_BIN` |

### ACP 子进程架构

- **连接方式**：`spawn` 子进程，通过 `stdin`/`stdout` 建立 NDJSON 流
- **SDK**：使用 `@agentclientprotocol/sdk` 的 `ClientSideConnection` 和 `ndJsonStream`
- **会话管理**：按 `accountId:peerId` 缓存 ACP `SessionId`，同一对话复用会话
- **对话队列**：同一会话的消息串行处理，避免并发冲突
- **权限处理**：默认 `auto` 模式，自动批准工具调用权限请求
- **生命周期**：子进程退出或连接断开时自动重置状态，下次请求自动重连

## Slash 命令

/openclaw /claude /codex /opencode /copilot /auggie /cursor /backend [name] /toggle-debug

## 安装

```
npx -y @leefeee/weixin-agent-code install
```

自动：版本检测 → 安装插件 → 禁用 openclaw-weixin → 启用本插件 → 扫码登录 → 重启 Gateway

## 持久化

- 后端选择：~/.openclaw/weixin-agent-code/backend-selection.json
- 微信账号凭证：复用 openclaw-weixin 存储机制
