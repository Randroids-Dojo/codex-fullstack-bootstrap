declare module 'better-auth/node' {
  import type { IncomingMessage, ServerResponse } from 'http';
  const toNodeHandler: (auth: { handler: (req: Request) => Promise<Response> } | ((req: Request) => Promise<Response>)) => (
    req: IncomingMessage,
    res: ServerResponse
  ) => Promise<void>;
  export { toNodeHandler };
}
