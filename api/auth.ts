import type { IncomingMessage, ServerResponse } from 'node:http';

export default function handler(
  req: IncomingMessage & { query?: Record<string, unknown> },
  res: ServerResponse
): void {
  const url = new URL(req.url || '/', 'http://localhost');
  const rawProvider = req.query?.provider;
  const queryProvider = Array.isArray(rawProvider)
    ? String(rawProvider[0] ?? '')
    : typeof rawProvider === 'string'
      ? rawProvider
      : '';
  const pathSegment = url.pathname.split('/').filter(Boolean).pop() || '';
  const provider = (queryProvider || pathSegment || 'google').toLowerCase();

  const envMap: Record<string, string | undefined> = {
    google: process.env.GOOGLE_AUTH_URL,
    apple: process.env.APPLE_AUTH_URL,
    facebook: process.env.FACEBOOK_AUTH_URL,
  };

  const targetUrl = envMap[provider];
  if (targetUrl) {
    res.statusCode = 302;
    res.setHeader('Location', targetUrl);
    res.end();
    return;
  }

  res.statusCode = 302;
  res.setHeader('Location', `/login.html?provider=${encodeURIComponent(provider)}`);
  res.end();
}
