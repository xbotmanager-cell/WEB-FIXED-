import crypto from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { readBody, setSessionCookie, signSession } from '../lib/session.js';

export default async function handler(
  req: IncomingMessage & { body?: unknown },
  res: ServerResponse
): Promise<void> {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  const body = await readBody(req);
  const identifier = (body.email || '').trim();
  if (!identifier) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Email or username is required.' }));
    return;
  }

  const staySignedIn = body.staySignedIn === 'true' || body.staySignedIn === 'on';
  const ttl = staySignedIn ? 60 * 60 * 24 * 30 : 60 * 60 * 24;
  const token = signSession(
    {
      userId: crypto.randomUUID(),
      email: identifier,
      name: identifier.split('@')[0] || identifier,
      accountType: 'standard',
    },
    ttl
  );

  setSessionCookie(res, token, staySignedIn ? ttl : undefined);

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ ok: true, redirect: '/home.html' }));
}
