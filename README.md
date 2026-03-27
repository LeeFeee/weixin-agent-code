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
- **lightweight 模式**：通过 ACP（Agent Communication Protocol）直接以子进程 stdio 方式连接各 CLI Agent，轻量稳定，适合单 Agent 对话场景。

## 支持的后端

| 后端 | 模式 | 说明 | ACP 命令 |
|------|------|------|----------|
| OpenClaw | openclaw | OpenClaw 内置 Agent，完整管道 | — |
| Claude Code | lightweight | Anthropic Claude Code CLI | `claude-agent-acp` |
| Codex | lightweight | OpenAI Codex CLI | `codex-acp` |
| OpenCode | lightweight | OpenCode CLI | `opencode acp` |
| GitHub Copilot | lightweight | GitHub Copilot CLI | `copilot --acp --stdio` |
| Auggie | lightweight | Auggie CLI | `auggie --acp` |
| Cursor | lightweight | Cursor Agent CLI | `cursor-agent acp` |

## 前置要求

- [Node.js](https://nodejs.org/) 22+
- [OpenClaw](https://github.com/openclaw/openclaw) >= 2026.3.23

安装后会自动处理：
- [@tencent-weixin/openclaw-weixin](https://www.npmjs.com/package/@tencent-weixin/openclaw-weixin) >= 2.0.0（作为 peerDependency）

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
6. 重启 Gateway

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

Lightweight 模式（claude/codex 等）需要本地安装对应的 CLI 工具，并确保其支持 ACP 协议：

```bash
# 例如使用 Claude Code
npm install -g @zed-industries/claude-agent-acp
claude-agent-acp   # 先完成登录和信任配置
```

各后端对应的 ACP CLI 工具需安装到系统 PATH 中，插件会在首次使用时自动拉起子进程。

## 配置

### 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `WEIXIN_CLAUDE_ACP_BIN` | Claude ACP 可执行文件路径 | `claude-agent-acp` |
| `WEIXIN_CODEX_ACP_BIN` | Codex ACP 可执行文件路径 | `codex-acp` |
| `WEIXIN_OPENCODE_ACP_BIN` | OpenCode ACP 可执行文件路径 | `opencode` |
| `WEIXIN_COPILOT_ACP_BIN` | Copilot ACP 可执行文件路径 | `copilot` |
| `WEIXIN_AUGGIE_ACP_BIN` | Auggie ACP 可执行文件路径 | `auggie` |
| `WEIXIN_CURSOR_ACP_BIN` | Cursor ACP 可执行文件路径 | `cursor-agent` |
| `WEIXIN_{BACKEND}_ACP_CWD` | 指定后端的工作目录 | 当前工作目录 |
| `WEIXIN_{BACKEND}_ACP_PERMISSION_MODE` | 权限模式（`auto` 自动允许 / `cancel` 全部拒绝） | `auto` |
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
- [Agent Client Protocol (ACP)](https://github.com/AcpProtocol/acp) — Agent 通信协议
- [@agentclientprotocol/sdk](https://www.npmjs.com/package/@agentclientprotocol/sdk) — ACP 协议官方 SDK
- [BytePioneer-AI/weixin-agent-gateway](https://github.com/BytePioneer-AI/weixin-agent-gateway) — 多后端路由和 ACP 集成的参考实现

## License

MIT
