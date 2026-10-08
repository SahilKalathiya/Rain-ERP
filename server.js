const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const DEFAULT_PORT = 3000;
const BASE_DIR = __dirname;
const REACT_DIR = path.join(BASE_DIR, 'Rain ERP', 'preclinic.dreamstechnologies.com', 'react');
const SITE_DIR = path.join(BASE_DIR, 'Rain ERP', 'preclinic.dreamstechnologies.com');

// Auto-compile React src to bundle on launch
try {
  const esbuild = require('esbuild');
  esbuild.buildSync({
    entryPoints: [path.join(BASE_DIR, 'frontend', 'src', 'main.jsx')],
    bundle: true,
    outfile: path.join(REACT_DIR, 'assets', 'index-DX-E0Odo.js'),
    loader: { '.jsx': 'jsx', '.js': 'jsx' },
    define: { 'process.env.NODE_ENV': '"production"' }
  });
  console.log('[Auto-Build] React bundle compiled successfully with Module 1.');
} catch (e) {
  console.error('[Auto-Build Error]', e);
}

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.js': 'text/javascript; charset=UTF-8',
  '.mjs': 'text/javascript; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.ico': 'image/x-icon',
};

function fetchRemoteAndCache(remoteUrl, localPath, res, contentType) {
  https.get(remoteUrl, (remoteRes) => {
    if (remoteRes.statusCode === 200) {
      fs.mkdirSync(path.dirname(localPath), { recursive: true });
      const fileStream = fs.createWriteStream(localPath);
      remoteRes.pipe(fileStream);

      res.writeHead(200, {
        'Content-Type': contentType || remoteRes.headers['content-type'] || 'application/octet-stream',
        'Cache-Control': 'public, max-age=86400'
      });
      remoteRes.pipe(res);
    } else {
      res.writeHead(remoteRes.statusCode || 404);
      res.end('Asset not found');
    }
  }).on('error', (err) => {
    res.writeHead(500);
    res.end('Proxy error: ' + err.message);
  });
}

function createServer(port) {
  const server = http.createServer((req, res) => {
    const parsedUrl = new URL(req.url, `http://localhost:${port}`);
    let pathname = decodeURIComponent(parsedUrl.pathname);

    // Root redirect to React dashboard
    if (pathname === '/' || pathname === '/react' || pathname === '/react/') {
      res.writeHead(302, { Location: '/react/dashboard' });
      return res.end();
    }

    // Direct route redirect (e.g. /orders -> /react/orders)
    if (!pathname.includes('.') && !pathname.startsWith('/react') && !pathname.startsWith('/assets')) {
      res.writeHead(302, { Location: `/react${pathname}` });
      return res.end();
    }

    // Try finding exact local file
    let localFile = null;

    if (pathname.startsWith('/react/assets/')) {
      localFile = path.join(REACT_DIR, pathname.replace(/^\/react/, ''));
    } else if (pathname.startsWith('/assets/')) {
      const tryReact = path.join(REACT_DIR, pathname);
      localFile = fs.existsSync(tryReact) ? tryReact : path.join(SITE_DIR, pathname);
    } else if (pathname === '/favicon.png' || pathname === '/react/favicon.png') {
      localFile = path.join(REACT_DIR, 'favicon.png');
    }

    // Check if the file exists on disk
    if (localFile && fs.existsSync(localFile) && fs.statSync(localFile).isFile()) {
      const ext = path.extname(localFile).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      return fs.createReadStream(localFile).pipe(res);
    }

    // If an asset is missing (e.g. dynamic images not downloaded during mirror), fetch and cache
    if (pathname.includes('/assets/img/')) {
      const relativeAsset = pathname.replace(/^\/react/, '');
      const savePath = path.join(REACT_DIR, relativeAsset);
      const remoteUrl = `https://preclinic.dreamstechnologies.com/react${relativeAsset}`;
      const ext = path.extname(pathname).toLowerCase();
      return fetchRemoteAndCache(remoteUrl, savePath, res, MIME_TYPES[ext]);
    }

    // Single Page Application (SPA) fallback: serve dashboard.html for all /react routes
    if (pathname.startsWith('/react/')) {
      const dashboardHtml = path.join(REACT_DIR, 'dashboard.html');
      if (fs.existsSync(dashboardHtml)) {
        let html = fs.readFileSync(dashboardHtml, 'utf8');
        if (!html.includes('<base')) {
          html = html.replace('<head>', '<head>\n    <base href="/react/">');
        }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=UTF-8' });
        return res.end(html);
      }
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found');
  });

  server.listen(port, () => {
    const url = `http://localhost:${port}/react/dashboard`;
    console.log(`\n======================================================`);
    console.log(`  Rain ERP / Preclinic Application is running!`);
    console.log(`  URL: ${url}`);
    console.log(`======================================================\n`);

    // Auto-open browser in Windows
    const startCmd = process.platform === 'win32' ? 'start' : (process.platform === 'darwin' ? 'open' : 'xdg-open');
    exec(`${startCmd} ${url}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${port} is in use, trying port ${port + 1}...`);
      createServer(port + 1);
    } else {
      console.error('Server error:', err);
    }
  });
}

createServer(process.env.PORT ? parseInt(process.env.PORT, 10) : DEFAULT_PORT);
