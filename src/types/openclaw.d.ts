/**
 * Ambient type declarations for `openclaw/plugin-sdk`.
 *
 * The openclaw CLI is not installed as a devDependency, so we provide just
 * enough shape information for TypeScript to compile without errors.
 *
 * All types are `any` — the real openclaw package provides the actual types
 * at runtime.  This file exists solely to satisfy TypeScript's type checker.
 */

declare module "openclaw/plugin-sdk" {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export type OpenClawConfig = any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export type PluginRuntime = any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export type ChannelPlugin<T = any> = any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export type ChannelAccountSnapshot = any;

  export function normalizeAccountId(raw: string): string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function withFileLock<T>(filePath: string, options: any, fn: () => Promise<T>): Promise<T>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function resolveDirectDmAuthorizationOutcome(params: any): any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function resolveSenderCommandAuthorizationWithRuntime(params: any): Promise<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function createTypingCallbacks(params: any): any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function buildChannelConfigSchema(schema: any): any;
  export function resolvePreferredOpenClawTmpDir(params?: any): string;
}

declare module "openclaw/plugin-sdk/core" {
  export type { OpenClawConfig } from "openclaw/plugin-sdk";
}
