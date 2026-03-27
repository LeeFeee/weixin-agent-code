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
