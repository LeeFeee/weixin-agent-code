# weixin-agent-code

一个 OpenClaw 插件，让微信成为多个 AI Coding Agent 的统一入口。

通过微信消息直接对话 Claude Code、Codex、OpenCode、GitHub Copilot、Auggie、Cursor，无需打开终端。

## 工作原理

```
微信 ←→ OpenClaw Gateway ←→ weixin-agent-code ←→ AI Agent
```

本插件作为 OpenClaw 的频道插件运行，复用 `@tencent-weixin/openclaw-weixin` 提供的微信通道能力（长轮询收消息、发送文本/图片/视频/文件、Typing 状态等），在之上添加了**多后端路由层**，将微信消息分发到不同的 AI Coding Agent。

支持两种后端模式：

- **openclaw 模式**：通过 OpenClaw 运行时的完整 Agent 路由管道，享受 OpenClaw 的会话管理、工具调用等全部能力。
- **lightweight 模式**：通过 AgentAPI（Go 二进制）HTTP 代理 + ACP 协议直连各 CLI Agent，轻量快速，适合单 Agent 对话场景。

## 支持的后端

| 后端 | 模式 | 说明 | AgentAPI 端口 |
|------|------|------|---------------|
| OpenClaw | openclaw | OpenClaw 内置 Agent，完整管道 | — |
| Claude Code | lightweight | Anthropic Claude Code CLI | 3285 |
| Codex | lightweight | OpenAI Codex CLI | 3284 |
| OpenCode | lightweight | OpenCode CLI | 3286 |
| GitHub Copilot | lightweight | GitHub Copilot CLI | 3287 |
| Auggie | lightweight | Auggie CLI | 3288 |
| Cursor | lightweight | Cursor Agent CLI | 3289 |

## 前置要求

- [Node.js](https://nodejs.org/) 22+
- [OpenClaw](https://github.com/openclaw/openclaw) >= 2026.3.23

安装后会自动处理：
- [@tencent-weixin/openclaw-weixin](https://www.npmjs.com/package/@tencent-weixin/openclaw-weixin) >= 2.0.0（作为 peerDependency）
- [AgentAPI](https://github.com/coder/agentapi)（lightweight 模式所需的 Go 二进制，首次使用时自动下载）

## 安装

```bash
npx -y @leefeee/weixin-agent-code install
```

安装流程会自动完成以下步骤：

1. 检测 OpenClaw 版本（需 >= 2026.3.23）
2. 安装插件到 OpenClaw
3. 禁用官方 openclaw-weixin 插件（避免通道冲突）
4. 启用本插件
5. 引导微信扫码登录
6. 下载 AgentAPI 二进制（lightweight 模式需要）
7. 重启 Gateway

安装完成后，打开微信即可开始对话。

## 使用

### 切换 AI 后端

在微信对话中发送斜杠命令即可切换：

```
/claude       切换到 Claude Code
/codex        切换到 Codex
/opencode     切换到 OpenCode
/copilot      切换到 GitHub Copilot
/auggie       切换到 Auggie
/cursor       切换到 Cursor
/openclaw     切换到 OpenClaw（默认）
```

也可以用 `/backend` 查看当前后端或手动指定：

```
/backend              查看当前后端
/backend claude       切换到 Claude Code
```

后端选择会按用户持久化保存，下次对话自动使用上次选择的后端。

### 其他命令

| 命令 | 说明 |
|------|------|
| `/echo <消息>` | 直接回复，不经过 AI |
| `/toggle-debug` | 开关 debug 模式，开启后会显示请求耗时 |

### 使用 Lightweight 后端

Lightweight 模式（claude/codex 等）需要本地安装对应的 CLI 工具：

```bash
# 例如使用 Claude Code
npm install -g @anthropic-ai/claude-code
claude   # 先登录
```

AgentAPI 会在首次请求对应后端时自动启动，默认监听 `localhost:328x`。

## 配置

### 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `WEIXIN_CLAUDE_AGENTAPI_URL` | Claude AgentAPI 地址 | `http://localhost:3285` |
| `WEIXIN_CODEX_AGENTAPI_URL` | Codex AgentAPI 地址 | `http://localhost:3284` |
| `WEIXIN_OPENCODE_AGENTAPI_URL` | OpenCode AgentAPI 地址 | `http://localhost:3286` |
| `WEIXIN_COPILOT_AGENTAPI_URL` | Copilot AgentAPI 地址 | `http://localhost:3287` |
| `WEIXIN_AUGGIE_AGENTAPI_URL` | Auggie AgentAPI 地址 | `http://localhost:3288` |
| `WEIXIN_CURSOR_AGENTAPI_URL` | Cursor AgentAPI 地址 | `http://localhost:3289` |
| `WEIXIN_AGENTAPI_AUTOSTART` | 禁用 AgentAPI 自动启动 | — |
| `OPENCLAW_LOG_LEVEL` | 日志级别 | `INFO` |

### OpenClaw 配置

在 `openclaw.json` 中可以为每个微信账号设置自定义参数：

```json
{
  "channels": {
    "weixin-agent-code": {
      "enabled": true,
      "accounts": {
        "<accountId>": {
          "name": "我的机器人",
          "baseUrl": "https://ilinkai.weixin.qq.com",
          "cdnBaseUrl": "https://novac2c.cdn.weixin.qq.com/c2c"
        }
      }
    }
  }
}
```

## 数据存储

所有数据存储在 `~/.openclaw/openclaw-weixin/` 目录下：

```
~/.openclaw/openclaw-weixin/
├── accounts/              # 微信账号凭证（token、baseUrl）
├── backend-selection.json # 用户后端选择记录
├── debug-mode.json        # debug 模式开关状态
└── *.sync.json           # 消息同步缓冲区
```

## 开发

```bash
# 安装依赖
npm install

# 编译
npm run build

# 编译产物在 dist/ 目录
```

## 致谢

本项目的实现参考了以下开源项目的架构和设计：

- [OpenClaw](https://github.com/openclaw/openclaw) — 插件框架和 Gateway 运行时
- [@tencent-weixin/openclaw-weixin](https://www.npmjs.com/package/@tencent-weixin/openclaw-weixin) — 微信通道能力（消息收发、媒体加解密、登录认证）
- [AgentAPI](https://github.com/coder/agentapi) — Lightweight 模式的 HTTP 代理（Go）
- [Agent Client Protocol (ACP)](https://github.com/AcpProtocol/acp) — Agent 通信协议
- [BytePioneer-AI/weixin-agent-gateway](https://github.com/BytePioneer-AI/weixin-agent-gateway) — 多后端路由和 AgentAPI 集成的参考实现

## License

MIT
