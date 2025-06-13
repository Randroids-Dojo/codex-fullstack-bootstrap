import "dotenv/config";
import express from "express";
import cors from "cors";
import { betterAuth } from "better-auth";
import { toNodeHandler } from "better-auth/node";
import { Pool } from "pg";
import { Kysely, PostgresDialect } from "kysely";

const PORT = Number(process.env.PORT) || 3001;

// build a pg pool + Kysely instance
const pool = new Pool({
  connectionString:
      process.env.DATABASE_URL ||
      "postgresql://postgres:supersecret@db:5432/postgres",
});
const db = new Kysely<any>({
  dialect: new PostgresDialect({ pool }),
});

export const auth = betterAuth({
  // @ts-ignore Better-Auth types currently omit `secret`
  secret: process.env.BETTER_AUTH_SECRET ?? "dev-insecure-secret-change-me",
  // @ts-ignore – property missing in public typings.
  trustedOrigins: [
    process.env.FRONTEND_URL ?? "http://localhost:5173",
    process.env.BETTER_AUTH_URL  ?? "http://localhost:3001",
  ],
  jwt: { secret: process.env.JWT_SECRET || "change-me" },
  emailAndPassword: { enabled: true },
  // supply the Kysely + pool so Better-Auth can run its migrations
  database: { db, type: "postgres" },
});

console.log("⏳ Running Better-Auth DB migration …");
try {
  const ctx = await (auth as any).$context;
  if (ctx && typeof ctx.runMigrations === "function") {
    await ctx.runMigrations();
    console.log("✅ Better-Auth migration complete");
    // Drop NOT NULL constraint on 'name' so default signup without name does not fail
    try {
      await pool.query('ALTER TABLE "user" ALTER COLUMN name DROP NOT NULL');
      console.log("✅ Dropped NOT NULL constraint on user.name");
    } catch (e) {
      console.warn("⚠️ Could not drop NOT NULL on user.name:", e);
    }
  } else {
    console.warn("⚠️  Better-Auth runMigrations() not available on context");
  }
} catch (err) {
  console.error("❌ Better-Auth migration failed:", err);
}

const app = express();
app.use(cors({ origin: ["http://localhost:5173"], credentials: true }));
app.all("/api/auth/:path*", toNodeHandler(auth as any));
app.use(express.json());
app.get("/healthz", (_, res) => res.json({ status: "ok" }));
app.listen(PORT, () =>
    console.log(`✅ Better-Auth listening on http://localhost:${PORT}`),
);