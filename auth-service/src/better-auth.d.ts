// Minimal ambient typings for the external "better-auth" package so TypeScript
// will compile even though the real library ships its own JS only, or provides
// incomplete types.  These definitions cover just the pieces used in our
// server code.

declare module "better-auth" {
  import { Router } from "express";

  interface BetterAuthOptions {
    jwt?: { secret: string };
    plugins?: any[];
    emailAndPassword?: { enabled: boolean };
  }

  interface BetterAuthInstance {
    router: Router;
  }

  export function betterAuth(opts: BetterAuthOptions): BetterAuthInstance;
}

