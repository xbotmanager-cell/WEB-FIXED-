import crypto from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { readBody, setSessionCookie, signSession } from '../lib/session.js';

export default async function handler(
  req: IncomingMessage & { body?: unknown; query?: Record<string, unknown> },
  res: ServerResponse
): Promise<void> {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  const body = await readBody(req);
  const url = new URL(req.url || '/', 'http://localhost');
  const rawType = req.query?.type;
  const queryType = Array.isArray(rawType) ? String(rawType[0] ?? '') : typeof rawType === 'string' ? rawType : '';
  const isBusiness =
    queryType === 'business' || url.pathname.includes('/business') || Boolean(body.businessName);

  const email = (isBusiness ? body.businessEmail : body.email) || '';
  const password = body.password || '';
  const name = isBusiness
    ? body.businessName || 'Business Account'
    : [body.firstName, body.lastName].filter(Boolean).join(' ').trim() || 'De-King Member';

  if (!email.trim() || password.length < 8) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Valid email and password (minimum 8 characters) are required.' }));
    return;
  }

  const staySignedIn = body.staySignedIn === 'on' || body.staySignedIn === 'true';
  const ttl = staySignedIn ? 60 * 60 * 24 * 30 : 60 * 60 * 24;
  const token = signSession(
    {
      userId: crypto.randomUUID(),
      email: email.trim(),
      name,
      accountType: isBusiness ? 'business' : 'personal',
    },
    ttl
  );

  setSessionCookie(res, token, staySignedIn ? ttl : undefined);

  const accept = req.headers.accept || '';
  if (accept.includes('application/json')) {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ ok: true, redirect: '/home.html', accountType: isBusiness ? 'business' : 'personal' }));
    return;
  }

  res.statusCode = 303;
  res.setHeader('Location', '/home.html');
  res.end();
}
