# weixin-agent-code Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** 复刻 weixin-agent-gateway 项目，使用最新的 openclaw-weixin 2.0.x 接口和 OpenClaw >=2026.3.23，支持通过 ACP 连接多个 AI Coding Agent。

**Architecture:** OpenClaw 插件模式，复用 openclaw-weixin 的微信通道能力，添加多后端路由层。双模式后端：openclaw 模式走 OpenClaw runtime，lightweight 模式通过 ACP 子进程 stdio 直连各 CLI Agent。

**Tech Stack:** TypeScript, OpenClaw Plugin SDK, @tencent-weixin/openclaw-weixin 2.0.x, @agentclientprotocol/sdk, ACP Protocol, Zod

---

### Task 1: 项目初始化

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `openclaw.plugin.json`
- Create: `.gitignore`

**Step 1: 创建 package.json**

```json
{
  "name": "@leefeee/weixin-agent-code",
  "version": "1.1.0",
  "description": "一个面向微信入口的多后端 AI 网关，支持 Claude Code、Codex、OpenCode、Copilot、Auggie、Cursor 等后端",
  "type": "module",
  "main": "dist/index.js",
  "exports": {
    ".": {
      "import": "./dist/index.js"
    }
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsc",
    "prepublishOnly": "npm run build"
  },
  "keywords": [
    "openclaw", "wechat", "weixin", "claude", "codex", "agent", "acp"
  ],
  "license": "MIT",
  "engines": {
    "openclaw": ">=2026.3.23"
  },
  "dependencies": {
    "@agentclientprotocol/sdk": "^0.16.1"
  },
  "peerDependencies": {
    "@tencent-weixin/openclaw-weixin": ">=2.0.0"
  },
  "devDependencies": {
    "typescript": "^5.7.0",
    "@types/node": "^22.0.0",
    "zod": "^3.25.0"
  }
}
```

**Step 2: 创建 tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "bundler",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": false,
    "sourceMap": false
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

**Step 3: 创建 openclaw.plugin.json**

```json
{
  "id": "weixin-agent-code",
  "channels": ["weixin-agent-code"],
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  }
}
```

**Step 4: 创建 .gitignore**

```
node_modules/
dist/
*.tgz
.DS_Store
```

**Step 5: 创建 src 目录结构**

```bash
mkdir -p src/{config,router,backends/{openclaw,claude,codex,opencode,copilot,auggie,cursor,lightweight},messaging,monitor,transport/weixin/outbound,cdn,media,util}
```

**Step 6: 初始提交**

```bash
git add -A && git commit -m "chore: initialize project structure"
```

---

### Task 2: 常量和类型定义

**Files:**
- Create: `src/constants.ts`
- Create: `src/backends/contracts.ts`
- Create: `src/config/config-schema.ts`
- Create: `src/util/logger.ts`
- Create: `src/util/redact.ts`
- Create: `src/runtime.ts`

**Step 1: 写 src/constants.ts**

```typescript
export const WEIXIN_PLUGIN_ID = "weixin-agent-code";
export const WEIXIN_CHANNEL_ID = "weixin-agent-code";
export const WEIXIN_PLUGIN_NAME = "Weixin Agent Code";

export const LEGACY_WEIXIN_PLUGIN_ID = "openclaw-weixin";
export const LEGACY_WEIXIN_CHANNEL_ID = "openclaw-weixin";

export const WEIXIN_STATE_NAMESPACE = LEGACY_WEIXIN_PLUGIN_ID;
export const MIN_OPENCLAW_VERSION = "2026.3.23";

export const DEFAULT_BACKEND_ID = "openclaw" as const;
```

**Step 2: 写 src/backends/contracts.ts**

```typescript
export const WEIXIN_BACKEND_IDS = [
  DEFAULT_BACKEND_ID,
  "codex",
  "claude",
  "opencode",
  "copilot",
  "auggie",
  "cursor",
] as const;

export type WeixinBackendId = (typeof WEIXIN_BACKEND_IDS)[number];

export const WEIXIN_BACKEND_LABELS: Record<string, string> = {
  openclaw: "OpenClaw",
  codex: "Codex",
  claude: "Claude Code",
  opencode: "OpenCode",
  copilot: "GitHub Copilot",
  auggie: "Auggie",
  cursor: "Cursor",
};

export function isWeixinBackendId(id: string): id is WeixinBackendId {
  return (WEIXIN_BACKEND_IDS as readonly string[]).includes(id);
}

export function normalizeWeixinBackendId(raw: string): WeixinBackendId | undefined {
  const trimmed = raw.trim().toLowerCase();
  if (trimmed === "claude-code") return "claude";
  if (trimmed === "github-copilot" || trimmed === "copilot-cli") return "copilot";
  if (trimmed === "cursor-cli" || trimmed === "cursor-agent") return "cursor";
  return isWeixinBackendId(trimmed) ? trimmed : undefined;
}

// --- Lightweight adapter ---

export type WeixinLightweightBackendInput = {
  accountId: string;
  peerId: string;
  senderId: string;
  text: string;
  imagePaths: string[];
  contextToken?: string;
  messageId?: string | number;
  timestamp?: number;
};

export type WeixinLightweightBackendOutput = {
  text?: string;
  mediaUrl?: string;
  mediaUrls?: string[];
};

export type WeixinLightweightBackendAdapter = {
  id: WeixinBackendId;
  mode: "lightweight";
  reply: (input: WeixinLightweightBackendInput) => Promise<WeixinLightweightBackendOutput | void>;
};

// --- OpenClaw adapter ---

export type WeixinOpenClawBackendAdapter = {
  id: WeixinBackendId;
  mode: "openclaw";
  dispatch: (ctx: WeixinBackendDispatchContext) => Promise<void>;
};

export type WeixinBackendDispatchContext = {
  accountId: string;
  backendContext: unknown;
};

export type WeixinBackendAdapter = WeixinOpenClawBackendAdapter | WeixinLightweightBackendAdapter;
```

**Step 3: 写 src/config/config-schema.ts**

```typescript
import { z } from "zod";

const weixinAccountSchema = z.object({
  name: z.string().optional(),
  enabled: z.boolean().optional(),
  baseUrl: z.string().default(""),
  cdnBaseUrl: z.string().default(""),
  routeTag: z.number().optional(),
});

export const WeixinConfigSchema = weixinAccountSchema.extend({
  accounts: z.record(z.string(), weixinAccountSchema).optional(),
  logUploadUrl: z.string().optional(),
});

export type WeixinConfig = z.infer<typeof WeixinConfigSchema>;
```

**Step 4-5:** 写 logger、redact、runtime（沿用原项目实现）

**Step 6: 提交**

```bash
git add src/ && git commit -m "feat: add constants, types, config, logger and runtime"
```

---

### Task 3: 插件入口和版本检查

**Files:**
- Create: `index.ts`
- Create: `cli.mjs`

[沿用原项目实现，修改 ID/名称/包名引用]

```bash
git add index.ts cli.mjs && git commit -m "feat: add plugin entry and install CLI"
```

---

### Task 4: 后端路由与选择持久化

**Files:**
- Create: `src/router/backend-router.ts`
- Create: `src/router/backend-selection.ts`
- Create: `src/backends/registry.ts`

```bash
git add src/router/ src/backends/registry.ts && git commit -m "feat: add backend router and selection persistence"
```

---

### Task 5: ACP 子进程客户端

**Files:**
- Create: `src/backends/lightweight/acp-subprocess-client.ts`
- Create: `src/backends/lightweight/input.ts`

**核心类 `AcpSubprocessLightweightClient`：**
- `ensureReady()` — spawn 子进程 + ACP initialize（懒加载，连接中断自动重连）
- `getOrCreateSession()` — 按 `accountId:peerId` 缓存 ACP SessionId
- `buildPromptBlocks()` — 构建文本 + 图片 ContentBlock[]
- `runLightweightConversation(input)` — 串行队列 + prompt + 收集输出
- `dispose()` — 清理子进程
- `requestPermission` 回调 — auto 模式自动批准工具调用
- `AcpResponseCollector` — 收集 `agent_message_chunk` 流式文本和图片输出

```bash
git add src/backends/lightweight/ && git commit -m "feat: add ACP subprocess client and lightweight input builder"
```

---

### Task 6: 各后端 ACP 适配器

**Files:**
- Create: `src/backends/openclaw/adapter.ts`
- Create: `src/backends/claude/acp-client.ts` + `src/backends/claude/adapter.ts`
- Create: `src/backends/codex/acp-client.ts` + `src/backends/codex/adapter.ts`
- Create: `src/backends/opencode/acp-client.ts` + `src/backends/opencode/adapter.ts`
- Create: `src/backends/copilot/acp-client.ts` + `src/backends/copilot/adapter.ts`
- Create: `src/backends/auggie/acp-client.ts` + `src/backends/auggie/adapter.ts`
- Create: `src/backends/cursor/acp-client.ts` + `src/backends/cursor/adapter.ts`

每个 lightweight 后端：
- `acp-client.ts` — 继承 `AcpSubprocessLightweightClient`，传入配置（backendId、命令、环境变量名、提示信息）
- `adapter.ts` — 创建单例客户端，实现 `WeixinLightweightBackendAdapter` 接口

```bash
git add src/backends/ && git commit -m "feat: add all backend adapters (openclaw/claude/codex/opencode/copilot/auggie/cursor)"
```

---

### Task 7-11: 消息处理、监控、传输层、CDN、媒体

[沿用原项目实现]

---

### Task 12: README、CHANGELOG 和构建验证

```bash
git add README.md README.en.md CHANGELOG.md && git commit -m "docs: add README and CHANGELOG"
npm run build && git add -A && git commit -m "chore: verify build output"
```

---

## 实施方式

使用 subagent-driven development 模式，每个 Task 由独立 subagent 执行，主 agent 审查后继续下一个 Task。

## 版本历史

- **v1.0.0** (2026-03-27) — 初始版本，使用 AgentAPI (Go binary) HTTP 代理
- **v1.1.0** (2026-03-28) — 迁移至 ACP，移除 AgentAPI，使用 @agentclientprotocol/sdk 直连 CLI Agent
