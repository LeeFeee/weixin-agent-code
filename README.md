# weixin-agent-code

基于 OpenClaw 插件系统的微信多后端 AI 网关，支持通过微信接入多个 AI Coding Agent。

## 特性

- 多后端支持：OpenClaw、Claude Code、Codex、OpenCode、GitHub Copilot、Auggie、Cursor
- 一键安装：`npx -y @leefeee/weixin-agent-code install`
- 双模式后端：OpenClaw 原生模式 + AgentAPI 轻量级模式
- 斜杠命令切换后端：`/claude`、`/codex`、`/opencode` 等
- 长轮询消息接收，支持文本/图片/视频/文件/语音
- Context Token 会话连续性
- Typing 状态指示
- Debug 模式（`/toggle-debug`）
- 后端选择持久化

## 兼容性

- OpenClaw >= 2026.3.23（硬性要求）
- @tencent-weixin/openclaw-weixin >= 2.0.0
- Node.js 22+

## 安装

```bash
npx -y @leefeee/weixin-agent-code install
```

自动完成：版本检测 → 安装插件 → 禁用 openclaw-weixin → 启用本插件 → 扫码登录 → 下载 AgentAPI → 重启 Gateway

## 后端

| 后端 | 模式 | AgentAPI 端口 | CLI 命令 |
|------|------|---------------|----------|
| openclaw | openclaw | N/A | N/A |
| claude | lightweight | localhost:3285 | claude |
| codex | lightweight | localhost:3284 | codex |
| opencode | lightweight | localhost:3286 | opencode |
| copilot | lightweight | localhost:3287 | copilot |
| auggie | lightweight | localhost:3288 | auggie |
| cursor | lightweight | localhost:3289 | cursor-agent |

## Slash 命令

- `/openclaw` `/claude` `/codex` `/opencode` `/copilot` `/auggie` `/cursor` — 切换后端
- `/backend [name]` — 查看或切换后端
- `/echo <message>` — 直接回复
- `/toggle-debug` — 开关 debug 模式

## 环境变量

- `WEIXIN_CLAUDE_AGENTAPI_URL` — Claude AgentAPI 地址（默认 localhost:3285）
- `WEIXIN_CODEX_AGENTAPI_URL` — Codex AgentAPI 地址（默认 localhost:3284）
- `WEIXIN_AGENTAPI_AUTOSTART` — 禁用自动启动（设为 false）
- `OPENCLAW_LOG_LEVEL` — 日志级别（默认 INFO）

## 持久化

- 后端选择：`~/.openclaw/openclaw-weixin/backend-selection.json`
- 微信凭证：复用 openclaw-weixin 存储机制

## 架构

```
微信 → openclaw-weixin 2.0.x (微信通道) → weixin-agent-code (路由层) → 后端
```

## License

MIT
