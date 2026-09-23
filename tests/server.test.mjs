import test from 'node:test';
import assert from 'node:assert/strict';
import { createAppServer } from '../server.mjs';

async function withServer(options, callback) {
  const server = createAppServer(options);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try { await callback(`http://127.0.0.1:${server.address().port}`); }
  finally { await new Promise(resolve => server.close(resolve)); }
}

test('static app loads and missing key never mints a token', async () => {
  await withServer({ apiKey:'' }, async base => {
    const page = await fetch(base); assert.equal(page.status, 200); assert.match(await page.text(), /RouteProof/);
    const token = await fetch(base + '/api/voice-token', { method:'POST' });
    assert.equal(token.status, 503); assert.match((await token.json()).error, /not configured/);
  });
});

test('server mints a short-lived token without exposing its API key to the page', async () => {
  let observed;
  await withServer({ apiKey:'test-secret', fetchImpl: async (url, options) => {
    observed = { url, authorization: options.headers.Authorization };
    return { ok:true, json:async () => ({ token:'temporary-token' }) };
  } }, async base => {
    const response = await fetch(base + '/api/voice-token', { method:'POST' });
    assert.equal(response.status, 200); assert.deepEqual(await response.json(), { token:'temporary-token' });
    const page = await (await fetch(base)).text(); assert.equal(page.includes('test-secret'), false);
  });
  assert.match(observed.url, /max_session_duration_seconds=300/);
  assert.equal(observed.authorization, 'Bearer test-secret');
});
