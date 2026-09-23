import { createServer } from 'node:http';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('./public/', import.meta.url)));
const envPath = fileURLToPath(new URL('./.env', import.meta.url));
if (existsSync(envPath)) process.loadEnvFile(envPath);
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml' };
const windows = new Map();
const globalWindow = [];
const port = Number(process.env.PORT || 3000);

function send(res, code, value, headers = {}) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers });
  res.end(JSON.stringify(value));
}

export function withinLimit(ip, now = Date.now()) {
  const recent = (windows.get(ip) || []).filter(time => now - time < 10 * 60_000);
  const globalRecent = globalWindow.filter(time => now - time < 60 * 60_000);
  globalWindow.splice(0, globalWindow.length, ...globalRecent);
  if (recent.length >= 4 || globalRecent.length >= 30) return false;
  recent.push(now);
  windows.set(ip, recent);
  globalWindow.push(now);
  return true;
}

export function createAppServer({ apiKey = process.env.ASSEMBLYAI_API_KEY, fetchImpl = fetch } = {}) {
  return createServer(async (req, res) => {
    const url = new URL(req.url || '/', 'http://localhost');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Content-Security-Policy', "default-src 'self'; connect-src 'self' https://agents.assemblyai.com wss://agents.assemblyai.com; img-src 'self' data:; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; script-src 'self'; media-src 'self' blob:; worker-src 'self' blob:; base-uri 'none'; form-action 'self'");

    if (url.pathname === '/api/health') return send(res, 200, { ready: Boolean(apiKey) });
    if (url.pathname === '/api/voice-token') {
      if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' }, { Allow: 'POST' });
      if (!apiKey) return send(res, 503, { error: 'AssemblyAI key is not configured on the server.' });
      if (!withinLimit(req.socket.remoteAddress || 'unknown')) return send(res, 429, { error: 'Voice session limit reached. Try again in a few minutes.' });
      try {
        const upstream = await fetchImpl('https://agents.assemblyai.com/v1/token?expires_in_seconds=60&max_session_duration_seconds=300', {
          headers: { Authorization: `Bearer ${apiKey}` },
          signal: AbortSignal.timeout(8000)
        });
        const body = await upstream.json();
        if (!upstream.ok || typeof body.token !== 'string') return send(res, 502, { error: 'AssemblyAI could not start a session.' });
        return send(res, 200, { token: body.token });
      } catch {
        return send(res, 502, { error: 'AssemblyAI is unavailable. Try again.' });
      }
    }

    if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, { error: 'Method not allowed' });
    let pathname;
    try { pathname = decodeURIComponent(url.pathname); } catch { return send(res, 400, { error: 'Bad path' }); }
    const path = resolve(root, '.' + pathname.replaceAll('\\', '/'));
    if (path !== root && !path.startsWith(root + sep)) return send(res, 404, { error: 'Not found' });
    const target = path === root ? resolve(root, 'index.html') : path;
    try {
      const data = await readFile(target);
      res.writeHead(200, { 'Content-Type': types[extname(target)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      res.end(req.method === 'HEAD' ? undefined : data);
    } catch { send(res, 404, { error: 'Not found' }); }
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  createAppServer().listen(port, () => console.log(`RouteProof on http://localhost:${port}`));
}
