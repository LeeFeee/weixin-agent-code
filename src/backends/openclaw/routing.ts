import type { OpenClawConfig, PluginRuntime } from "openclaw/plugin-sdk";

import { WEIXIN_CHANNEL_ID } from "../../constants.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type OpenClawResolvedRoute = any;

export function resolveOpenClawAgentRoute(params: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  channelRuntime: any;
  config: OpenClawConfig;
  accountId: string;
  peerId: string;
}): OpenClawResolvedRoute {
  return params.channelRuntime.routing.resolveAgentRoute({
    cfg: params.config,
    channel: WEIXIN_CHANNEL_ID,
    accountId: params.accountId,
    peer: { kind: "direct", id: params.peerId },
  });
}
