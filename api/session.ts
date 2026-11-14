import type { IncomingMessage, ServerResponse } from 'node:http';
import { clearSessionCookie, getSessionFromRequest } from '../lib/session.js';

export default function handler(req: IncomingMessage, res: ServerResponse): void {
  if (req.method === 'DELETE' || req.method === 'POST') {
    clearSessionCookie(res);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ authenticated: false }));
    return;
  }

  const session = getSessionFromRequest(req);
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(
    JSON.stringify(
      session
        ? {
            authenticated: true,
            user: {
              userId: session.userId,
              email: session.email,
              name: session.name,
              accountType: session.accountType,
            },
          }
        : { authenticated: false }
    )
  );
}
