import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.string().default('development'),
  DATABASE_URL: z.string().url().startsWith('postgres').optional(),
  ADMIN_PASSWORD_HASH: z.string().min(20).default('$2b$10$diFYwBITpflwh74lFWzXIet2kZOzLwjQzvJpnhHgQDwkzk3O3HpBC'),
  SESSION_SECRET: z.string().min(16).default('cultura-lap-secret-session-key-at-least-48-characters-long-2026'),
  DATA_RETENTION_DAYS: z.coerce.number().int().min(30).max(3650).default(730)
});

export function readConfig(env = process.env) {
  const parsed = schema.safeParse(env);
  if (!parsed.success) {
    const fields = parsed.error.issues.map((issue) => issue.path.join('.')).join(', ');
    throw new Error(`Invalid server configuration: ${fields}`);
  }

  return {
    nodeEnv: parsed.data.NODE_ENV,
    databaseUrl: parsed.data.DATABASE_URL,
    adminPasswordHash: parsed.data.ADMIN_PASSWORD_HASH,
    sessionSecret: parsed.data.SESSION_SECRET,
    retentionDays: parsed.data.DATA_RETENTION_DAYS
  };
}
