import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import registerHandler from './api/register.js';
import loginHandler from './api/login.js';
import authHandler from './api/auth.js';
import sessionHandler from './api/session.js';
import healthHandler from './api/health.js';
import { getSessionFromRequest } from './lib/session.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === 'production';
const staticRoot = isProd
  ? path.join(__dirname, 'dist')
  : path.join(__dirname, 'public');

const LEGACY_PAGE_ALIASES: Record<string, string> = {
  'deals.php': '/deals.html',
  'deals.html': '/deals.html',
  deals: '/deals.html',
  'featured.php': '/brand-outlet.html',
  'featured.html': '/brand-outlet.html',
  featured: '/brand-outlet.html',
  'fashion.php': '/brand-outlet.html',
  'fashion.html': '/brand-outlet.html',
  fashion: '/brand-outlet.html',
  'home-goods.php': '/home-and-garden.html',
  'home-goods.html': '/home-and-garden.html',
  'home-goods': '/home-and-garden.html',
  'more.php': '/tech.html',
  'more.html': '/tech.html',
  more: '/tech.html',
};

const LEGACY_ASSET_ALIASES: Record<string, string> = {
  'De-King.png': '/assets/images/de-king-logo.svg',
  'De-king.png': '/assets/images/de-king-logo.svg',
  'styleeeeeeaaaa1112.css': '/assets/css/style.css',
  'styles.css': '/assets/css/auth.css',
  'script.js': '/assets/js/auth.js',
  'delivery.jpg': '/assets/images/delivery.jpg',
  'fashion.jpg': '/assets/images/fashion.jpg',
  'gift cards.jpg': '/assets/images/gift-cards.jpg',
  'group.jpg': '/assets/images/group.jpg',
  'pic.jpg': '/assets/images/pic.jpg',
  'pic2.jpg': '/assets/images/pic2.jpg',
  'cc3.avif': '/assets/images/cc3.jpg',
  'kk2.avif': '/assets/images/kk2.jpg',
  'cc33.avif': '/assets/images/cc33.jpg',
  'ttt6.webp': '/assets/images/ttt6.jpg',
};

async function createApp() {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API & Auth routes
  app.get('/api/health', (req, res) => healthHandler(req, res));
  app.get('/api/session', (req, res) => sessionHandler(req, res));
  app.post('/api/session', (req, res) => sessionHandler(req, res));
  app.delete('/api/session', (req, res) => sessionHandler(req, res));
  app.post('/api/login', (req, res) => void loginHandler(req, res));
  app.post('/api/register', (req, res) => void registerHandler(req, res));
  app.post('/register/personal', (req, res) => {
    req.query = { ...req.query, type: 'personal' };
    void registerHandler(req, res);
  });
  app.post('/register/business', (req, res) => {
    req.query = { ...req.query, type: 'business' };
    void registerHandler(req, res);
  });
  app.get('/auth/:provider', (req, res) => {
    req.query = { ...req.query, provider: req.params.provider };
    authHandler(req, res);
  });

  // Legacy PHP account-settings guard
  app.get(['/account-settings', '/account-settings.html', '/account-settings.php'], (req, res, next) => {
    const session = getSessionFromRequest(req);
    if (!session) {
      res.redirect(302, '/login.html');
      return;
    }
    if (req.path.endsWith('.php') || req.path === '/account-settings') {
      res.sendFile(path.join(staticRoot, 'account-settings.html'));
      return;
    }
    next();
  });

  // Legacy asset redirects/serving
  app.use((req, res, next) => {
    const cleanPath = decodeURIComponent(req.path.replace(/^\/+/, ''));
    if (LEGACY_ASSET_ALIASES[cleanPath]) {
      res.sendFile(path.join(staticRoot, LEGACY_ASSET_ALIASES[cleanPath]));
      return;
    }
    if (LEGACY_PAGE_ALIASES[cleanPath]) {
      const target = LEGACY_PAGE_ALIASES[cleanPath].replace(/^\/+/, '');
      res.sendFile(path.join(staticRoot, target));
      return;
    }
    if (cleanPath.endsWith('.php')) {
      const htmlCandidate = cleanPath.slice(0, -4) + '.html';
      const full = path.join(staticRoot, htmlCandidate);
      if (fs.existsSync(full)) {
        res.sendFile(full);
        return;
      }
    }
    next();
  });

  // Root entry serves index.html (synced with home.html)
  app.get(['/', '/index.html'], (_req, res) => {
    const rootIndex = isProd
      ? path.join(staticRoot, 'index.html')
      : path.join(__dirname, 'index.html');
    res.sendFile(rootIndex);
  });

  app.use(express.static(staticRoot));

  // Extensionless clean URLs (matching Vercel cleanUrls: true)
  app.get('/:page', (req, res, next) => {
    const page = req.params.page;
    if (page.includes('.')) {
      next();
      return;
    }
    const candidate = path.join(staticRoot, `${page}.html`);
    if (fs.existsSync(candidate)) {
      res.sendFile(candidate);
      return;
    }
    next();
  });

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });
    app.use(vite.middlewares);
  }

  return app;
}

createApp()
  .then((app) => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`De-King server listening on http://0.0.0.0:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
