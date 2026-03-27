import { logger } from "../../util/logger.js";

export const DEFAULT_BACKEND_PORTS: Record<string, number> = {
  codex: 3284,
  claude: 3285,
  opencode: 3286,
  copilot: 3287,
  auggie: 3288,
  cursor: 3289,
};

export type AgentApiClientOptions = {
  label: string;
  baseUrl: string;
  autoStart?: {
    backendId: string;
  };
  timeoutMs?: number;
};

type AgentApiMessage = {
  id: string;
  role: string;
  content?: string;
  createdAt?: number;
};

type AgentApiStatus = {
  state: string;
  sessionId?: string;
};

export class AgentApiClient {
  private label: string;
  private baseUrl: string;
  private timeoutMs: number;

  constructor(opts: AgentApiClientOptions) {
    this.label = opts.label;
    this.baseUrl = opts.baseUrl.replace(/\/+$/, "");
    this.timeoutMs = opts.timeoutMs ?? 60_000;
  }

  private async apiFetch<T>(endpoint: string, options?: {
    method?: string;
    body?: unknown;
    timeoutMs?: number;
  }): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const timeoutMs = options?.timeoutMs ?? this.timeoutMs;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        method: options?.method ?? "GET",
        headers: options?.body ? { "Content-Type": "application/json" } : undefined,
        body: options?.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`AgentAPI ${endpoint} returned ${res.status}: ${text}`);
      }
      return await res.json() as T;
    } catch (err) {
      clearTimeout(timer);
      if (err instanceof Error && err.name === "AbortError") {
        throw new Error(`AgentAPI ${endpoint} timed out after ${timeoutMs}ms`);
      }
      throw err;
    }
  }

  async getStatus(): Promise<AgentApiStatus> {
    return this.apiFetch<AgentApiStatus>("/status");
  }

  async getMessages(params?: { since?: string }): Promise<AgentApiMessage[]> {
    const query = params?.since ? `?since=${encodeURIComponent(params.since)}` : "";
    return this.apiFetch<AgentApiMessage[]>(`/messages${query}`);
  }

  async postMessage(params: { content: string; images?: string[] }): Promise<void> {
    await this.apiFetch("/message", {
      method: "POST",
      body: { content: params.content, images: params.images },
    });
  }

  async uploadFile(params: { filePath: string }): Promise<void> {
    const { promises } = await import("node:fs");
    const content = await promises.readFile(params.filePath);
    const url = `${this.baseUrl}/upload`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/octet-stream" },
      body: new Uint8Array(content),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`AgentAPI upload returned ${res.status}: ${text}`);
    }
  }

  async waitUntilStable(opts?: {
    timeoutMs?: number;
    intervalMs?: number;
  }): Promise<void> {
    const timeout = opts?.timeoutMs ?? 120_000;
    const interval = opts?.intervalMs ?? 1_000;
    const start = Date.now();
    while (Date.now() - start < timeout) {
      try {
        const status = await this.getStatus();
        if (status.state === "stable" || status.state === "idle") return;
      } catch {
        // AgentAPI may not be ready yet; keep trying
      }
      await new Promise((r) => setTimeout(r, interval));
    }
    throw new Error(`AgentAPI did not reach stable state within ${timeout}ms`);
  }

  async ensureReady(opts?: { timeoutMs?: number }): Promise<void> {
    const timeout = opts?.timeoutMs ?? 10_000;
    const start = Date.now();
    while (Date.now() - start < timeout) {
      try {
        await this.getStatus();
        return;
      } catch {
        // Not ready yet
      }
      await new Promise((r) => setTimeout(r, 500));
    }
    logger.warn(`[${this.label}] AgentAPI not reachable at ${this.baseUrl} after ${timeout}ms`);
  }

  async runLightweightConversation(params: {
    text: string;
    imagePaths?: string[];
  }): Promise<{ text?: string; mediaUrl?: string; mediaUrls?: string[] }> {
    await this.ensureReady();

    // Get messages before sending to know what's new after
    const beforeMessages = await this.getMessages();
    const lastId = beforeMessages.length > 0
      ? beforeMessages[beforeMessages.length - 1].id
      : undefined;

    // Upload images if any
    if (params.imagePaths && params.imagePaths.length > 0) {
      for (const imgPath of params.imagePaths) {
        try {
          await this.uploadFile({ filePath: imgPath });
        } catch (err) {
          logger.warn(`[${this.label}] Failed to upload image ${imgPath}: ${String(err)}`);
        }
      }
    }

    // Send the message
    await this.postMessage({ content: params.text });

    // Wait for agent to finish
    await this.waitUntilStable();

    // Get new messages
    const afterMessages = await this.getMessages({ since: lastId });
    const agentMessages = afterMessages.filter(
      (m) => m.role === "assistant" || m.role === "agent"
    );

    if (agentMessages.length === 0) {
      return {};
    }

    // Extract text from last agent message
    const lastAgentMsg = agentMessages[agentMessages.length - 1];
    return {
      text: lastAgentMsg.content,
    };
  }
}
