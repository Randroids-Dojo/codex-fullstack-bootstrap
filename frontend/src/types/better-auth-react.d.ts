declare module "better-auth/react" {
  interface ClientOptions {
    baseURL: string;
  }

  interface Session {
    token: string;
    user: { email: string };
  }

  export interface AuthClient {
    signIn: {
      email: (payload: { email: string; pw: string }) => Promise<{ session: Session }>;
    };
    signUp: {
      email: (payload: { email: string; pw: string }) => Promise<{ session: Session }>;
    };
    me: () => Promise<{ email: string }>;
  }

  export function createAuthClient(opts: ClientOptions): AuthClient;
}
