import type { PluginRuntime } from "openclaw/plugin-sdk";

import { logger } from "./util/logger.js";

let pluginRuntime: PluginRuntime | null = null;

export type PluginChannelRuntime = PluginRuntime["channel"];

export function setWeixinRuntime(next: PluginRuntime): void {
  pluginRuntime = next;
  logger.info(`[runtime] setWeixinRuntime called, runtime set successfully`);
}

export function getWeixinRuntime(): PluginRuntime {
  if (!pluginRuntime) {
    throw new Error("Weixin runtime not initialized");
  }
  return pluginRuntime;
}

const WAIT_INTERVAL_MS = 100;
const DEFAULT_TIMEOUT_MS = 10_000;

export async function waitForWeixinRuntime(
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<PluginRuntime> {
  const start = Date.now();
  while (!pluginRuntime) {
    if (Date.now() - start > timeoutMs) {
      throw new Error("Weixin runtime initialization timeout");
    }
    await new Promise((resolve) => setTimeout(resolve, WAIT_INTERVAL_MS));
  }
  return pluginRuntime;
}

export async function resolveWeixinChannelRuntime(params: {
  channelRuntime?: PluginChannelRuntime;
  waitTimeoutMs?: number;
}): Promise<PluginChannelRuntime> {
  if (params.channelRuntime) {
    logger.debug("[runtime] channelRuntime from gateway context");
    return params.channelRuntime;
  }
  if (pluginRuntime) {
    logger.debug("[runtime] channelRuntime from register() global");
    return pluginRuntime.channel;
  }
  logger.warn(
    "[runtime] no channelRuntime on ctx and no global runtime yet; waiting for register()",
  );
  const pr = await waitForWeixinRuntime(params.waitTimeoutMs ?? DEFAULT_TIMEOUT_MS);
  return pr.channel;
}
