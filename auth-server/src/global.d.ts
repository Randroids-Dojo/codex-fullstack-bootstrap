/* Minimal global declarations for auth-server TypeScript build */

declare const process: {
  env: Record<string, string | undefined>;
};

declare module 'better-auth' {
  export interface BetterAuthOptions {
    database: { url: string; provider?: string };
    basePath?: string;
    jwt: {
      secret: string;
      algorithm: string;
      expiresIn: string | number;
      issuer: string;
      audience: string;
    };
    cookies?: Record<string, unknown>;
    providers: unknown[];
  }

  export interface BetterAuthInstance {
    handler: (request: Request) => Promise<Response>;
  }

  export function betterAuth(options: BetterAuthOptions): BetterAuthInstance;
}

declare module 'express' {
  const v: any;
  export = v;
}

declare module 'cors' {
  const v: any;
  export = v;
}

declare module 'pg' {
  const v: any;
  export = v;
}
