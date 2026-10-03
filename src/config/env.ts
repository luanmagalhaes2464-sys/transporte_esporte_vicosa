import { z } from "zod";

const schema = z.object({
  APP_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_URL: z.string().url().default("http://localhost:3000"),
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().min(1).optional(),
  AUTH_SECRET: z.string().min(32),
  SESSION_MAX_AGE_HOURS: z.coerce.number().int().positive().default(12),
  CEP_PROVIDER: z.enum(["viacep", "brasilapi", "correios"]).default("viacep"),
  GEOCODING_PROVIDER: z.enum(["nominatim", "google", "none"]).default("nominatim"),
  MUNICIPALITY_NAME: z.string().default("Viçosa"),
  MUNICIPALITY_STATE: z.string().length(2).default("MG"),
  MUNICIPALITY_IBGE_CODE: z.string().default("3171303"),
  NOMINATIM_BASE_URL: z.string().url().default("https://nominatim.openstreetmap.org"),
  GOOGLE_MAPS_API_KEY: z.string().optional(),
  STORAGE_PROVIDER: z.enum(["s3", "none"]).default("none"),
  STORAGE_BUCKET: z.string().optional(),
  STORAGE_REGION: z.string().optional(),
  STORAGE_ENDPOINT: z.string().url().optional(),
  STORAGE_ACCESS_KEY_ID: z.string().optional(),
  STORAGE_SECRET_ACCESS_KEY: z.string().optional(),
  EMAIL_PROVIDER: z.enum(["none", "resend", "smtp"]).default("none"),
  EMAIL_FROM: z.string().default("Portal Viçosa <no-reply@example.org>"),
  EMAIL_API_KEY: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_SECURE: z.coerce.boolean().default(false),
  DOCUMENT_AI_PROVIDER: z.enum(["none", "neon"]).default("none"),
  DOCUMENT_AI_MODEL: z.string().default("gpt-5-4-mini"),
  NEON_AI_GATEWAY_BASE_URL: z.string().url().optional(),
  NEON_AI_GATEWAY_TOKEN: z.string().optional()
});

export type Env = z.infer<typeof schema>;
let cached: Env | null = null;
export function env(): Env {
  if (!cached) cached = schema.parse(process.env);
  return cached;
}
