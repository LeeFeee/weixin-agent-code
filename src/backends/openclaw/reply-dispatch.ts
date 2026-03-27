import { createTypingCallbacks } from "openclaw/plugin-sdk";
import type { OpenClawConfig, PluginRuntime } from "openclaw/plugin-sdk";

export function createOpenClawTypingCallbacks(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
  return createTypingCallbacks(params);
}

export function createOpenClawReplyDispatcher(params: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  channelRuntime: any;
  config: OpenClawConfig;
  agentId?: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  typingCallbacks: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  deliver: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onError: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
}): any {
  const humanDelay = params.channelRuntime.reply.resolveHumanDelayConfig(params.config, params.agentId);
  return params.channelRuntime.reply.createReplyDispatcherWithTyping({
    humanDelay,
    typingCallbacks: params.typingCallbacks,
    deliver: params.deliver,
    onError: params.onError,
  });
}
