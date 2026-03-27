import type { OpenClawConfig, PluginRuntime } from "openclaw/plugin-sdk";

import { WEIXIN_CHANNEL_ID } from "../../constants.js";
import type { WeixinMsgContext } from "../../messaging/inbound.js";

import type { OpenClawResolvedRoute } from "./routing.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FinalizedOpenClawInboundContext = any;

export function finalizeOpenClawInboundContext(params: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  channelRuntime: any;
  config: OpenClawConfig;
  route: OpenClawResolvedRoute;
  ctx: WeixinMsgContext;
}): {
  finalized: FinalizedOpenClawInboundContext;
  storePath: string;
} {
  params.ctx.SessionKey = params.route.sessionKey;
  const storePath = params.channelRuntime.session.resolveStorePath(params.config.session?.store, {
    agentId: params.route.agentId,
  });
  const finalized = params.channelRuntime.reply.finalizeInboundContext(params.ctx);
  return { finalized, storePath };
}

export async function recordOpenClawInboundSession(params: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  channelRuntime: any;
  storePath: string;
  route: OpenClawResolvedRoute;
  finalized: FinalizedOpenClawInboundContext;
  accountId: string;
  to: string;
  errLog: (message: string) => void;
}): Promise<void> {
  await params.channelRuntime.session.recordInboundSession({
    storePath: params.storePath,
    sessionKey: params.route.sessionKey,
    ctx: params.finalized,
    updateLastRoute: {
      sessionKey: params.route.mainSessionKey,
      channel: WEIXIN_CHANNEL_ID,
      to: params.to,
      accountId: params.accountId,
    },
    onRecordError: (err: unknown) => params.errLog(`recordInboundSession: ${String(err)}`),
  });
}
