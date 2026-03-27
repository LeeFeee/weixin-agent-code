import type { PluginRuntime } from "openclaw/plugin-sdk";

import type { WeixinBackendAdapter, WeixinBackendDispatchContext } from "../contracts.js";

import { logger } from "../../util/logger.js";

type OpenClawBackendDispatchContext = {
  config: import("openclaw/plugin-sdk/core").OpenClawConfig;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  channelRuntime: any;
  agentId?: string | null;
  finalized: unknown;
  dispatcher: unknown;
  replyOptions: unknown;
};

function castOpenClawDispatchContext(ctx: WeixinBackendDispatchContext): OpenClawBackendDispatchContext {
  return ctx.backendContext as OpenClawBackendDispatchContext;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function castDispatcher(dispatcher: unknown): any {
  return dispatcher;
}

function castDispatchArgs(ctx: OpenClawBackendDispatchContext): {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ctx: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dispatcher: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  replyOptions: any;
} {
  return {
    ctx: ctx.finalized,
    dispatcher: ctx.dispatcher,
    replyOptions: ctx.replyOptions,
  };
}

export const openclawBackendAdapter: WeixinBackendAdapter = {
  id: "openclaw",
  mode: "openclaw",
  async dispatch(ctx) {
    const backendCtx = castOpenClawDispatchContext(ctx);
    logger.debug(`backend=openclaw dispatch: starting agentId=${backendCtx.agentId ?? "(none)"}`);
    const dispatcher = castDispatcher(backendCtx.dispatcher);
    const dispatchArgs = castDispatchArgs(backendCtx);
    try {
      await backendCtx.channelRuntime.reply.withReplyDispatcher({
        dispatcher,
        run: () =>
          backendCtx.channelRuntime.reply.dispatchReplyFromConfig({
            ctx: dispatchArgs.ctx,
            cfg: backendCtx.config,
            dispatcher: dispatchArgs.dispatcher,
            replyOptions: dispatchArgs.replyOptions,
          }),
      });
      logger.debug(`backend=openclaw dispatch: done agentId=${backendCtx.agentId ?? "(none)"}`);
    } catch (err) {
      logger.error(`backend=openclaw dispatch: error agentId=${backendCtx.agentId ?? "(none)"} err=${String(err)}`);
      throw err;
    }
  },
};
