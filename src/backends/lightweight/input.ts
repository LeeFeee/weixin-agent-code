import type { WeixinLightweightBackendInput } from "../contracts.js";

// NOTE: In the full implementation, WeixinMessage and WeixinMsgContext are used here.
// For now this is a simplified version that will be connected in the messaging pipeline.

export function buildWeixinLightweightBackendInput(params: {
  accountId: string;
  peerId: string;
  senderId: string;
  text: string;
  imagePaths: string[];
  contextToken?: string;
  messageId?: string | number;
  timestamp?: number;
}): WeixinLightweightBackendInput {
  return {
    accountId: params.accountId,
    peerId: params.peerId,
    senderId: params.senderId,
    text: params.text,
    imagePaths: params.imagePaths,
    contextToken: params.contextToken,
    messageId: typeof params.messageId === "number" ? String(params.messageId) : params.messageId,
    timestamp: params.timestamp,
  };
}
