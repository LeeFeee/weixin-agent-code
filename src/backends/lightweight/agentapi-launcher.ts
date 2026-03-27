import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

import { DEFAULT_BACKEND_PORTS } from "./agentapi-client.js";
import { logger } from "../../util/logger.js";

const DEFAULT_USER_BIN_DIR = path.join(
  process.env.HOME || process.env.USERPROFILE || "/tmp",
  ".local",
  "bin",
);

export const BACKEND_PORT_MAP: Record<string, number> = DEFAULT_BACKEND_PORTS;

type BackendCommand = {
  codex: string;
  claude: string;
  opencode: string;
  copilot: string;
  auggie: string;
  cursor: string;
};

const BACKEND_COMMANDS: BackendCommand = {
  codex: "codex",
  claude: "claude",
  opencode: "opencode",
  copilot: "copilot",
  auggie: "auggie",
  cursor: "cursor-agent",
};

function isAutoStartDisabled(): boolean {
  const env = process.env.WEIXIN_AGENTAPI_AUTOSTART || process.env.AGENTAPI_AUTOSTART;
  return env?.toLowerCase() === "false" || env === "0";
}

function resolveAgentApiBin(): string {
  const envBin = process.env.WEIXIN_AGENTAPI_BIN || process.env.AGENTAPI_BIN;
  if (envBin) return envBin.trim();
  return "agentapi";
}

function resolveAgentCommand(backendId: string): string {
  return BACKEND_COMMANDS[backendId as keyof BackendCommand] || backendId;
}

const startupTasks = new Map<string, Promise<void>>();

export async function ensureAgentApiRunning(params: {
  backendId: string;
}): Promise<string> {
  if (isAutoStartDisabled()) {
    const port = BACKEND_PORT_MAP[params.backendId];
    if (!port) throw new Error(`Unknown backend: ${params.backendId}`);
    return `http://localhost:${port}`;
  }

  const existing = startupTasks.get(params.backendId);
  if (existing) await existing;

  const port = BACKEND_PORT_MAP[params.backendId];
  if (!port) throw new Error(`Unknown backend: ${params.backendId}`);

  const url = process.env[`WEIXIN_${params.backendId.toUpperCase()}_AGENTAPI_URL`]?.trim() ||
    `http://localhost:${port}`;

  // Check if already reachable
  try {
    const res = await fetch(`${url}/status`, { signal: AbortSignal.timeout(2_000) });
    if (res.ok) return url;
  } catch {
    // Not reachable, try to start
  }

  const task = startLocalAgentApi(params.backendId, url);
  startupTasks.set(params.backendId, task);
  await task;
  return url;
}

async function startLocalAgentApi(backendId: string, url: string): Promise<void> {
  const agentapiBin = resolveAgentApiBin();
  const agentCmd = resolveAgentCommand(backendId);

  logger.info(`[agentapi-launcher] Starting AgentAPI for ${backendId} on port ${new URL(url).port}`);

  const proc = spawn(agentapiBin, [agentCmd], {
    detached: true,
    stdio: "ignore",
    env: {
      ...process.env,
      AGENTAPI_ADDR: url,
    },
  });

  proc.unref();

  // Wait for the agent to become ready
  const start = Date.now();
  const timeout = 30_000;
  while (Date.now() - start < timeout) {
    try {
      const res = await fetch(`${url}/status`, { signal: AbortSignal.timeout(2_000) });
      if (res.ok) {
        logger.info(`[agentapi-launcher] AgentAPI for ${backendId} is ready at ${url}`);
        return;
      }
    } catch {
      // Not ready yet
    }
    await new Promise((r) => setTimeout(r, 500));
  }

  logger.warn(
    `[agentapi-launcher] AgentAPI for ${backendId} did not become ready within ${timeout}ms`,
  );
}
