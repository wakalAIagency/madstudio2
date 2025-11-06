import { z } from "zod";

const serverSchema = z
  .object({
    SUPABASE_URL: z.string().url(),
    SUPABASE_ANON_KEY: z.string().min(1),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
    NEXTAUTH_SECRET: z.string().min(1),
    RESEND_API_KEY: z.string().min(1).optional(),
    BOOKING_FROM_EMAIL: z.string().email().optional(),
    BASE_URL: z.string().url().optional(),
    TIMEZONE: z.string().min(1).optional(),
  })
  .transform((env) => ({
    ...env,
    TIMEZONE: env.TIMEZONE ?? "Asia/Muscat",
  }));

const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_SLOT_DURATION_MINUTES: z
    .string()
    .transform((value) => parseInt(value, 10))
    .pipe(z.number().int().positive())
    .optional(),
  NEXT_PUBLIC_TIMEZONE: z.string().min(1).optional(),
});

let serverEnv: z.infer<typeof serverSchema> | undefined;
let clientEnv: z.infer<typeof clientSchema> | undefined;

export function getServerEnv() {
  if (!serverEnv) {
    const parsed = serverSchema.safeParse(process.env);

    if (!parsed.success) {
      throw new Error(
        `Invalid server environment variables:\n${parsed.error.errors
          .map((err) => `${err.path.join(".")}: ${err.message}`)
          .join("\n")}`,
      );
    }

    serverEnv = parsed.data;
  }

  return serverEnv;
}

export function getClientEnv() {
  if (!clientEnv) {
    const parsed = clientSchema.safeParse({
      NEXT_PUBLIC_SUPABASE_URL:
        process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY:
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
        process.env.SUPABASE_ANON_KEY,
      NEXT_PUBLIC_SLOT_DURATION_MINUTES:
        process.env.NEXT_PUBLIC_SLOT_DURATION_MINUTES,
      NEXT_PUBLIC_TIMEZONE:
        process.env.NEXT_PUBLIC_TIMEZONE ?? process.env.TIMEZONE,
    });

    if (!parsed.success) {
      throw new Error(
        `Invalid client environment variables:\n${parsed.error.errors
          .map((err) => `${err.path.join(".")}: ${err.message}`)
          .join("\n")}`,
      );
    }

    clientEnv = parsed.data;
  }

  return clientEnv;
}
