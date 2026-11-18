const assert = require('node:assert/strict');
const { once } = require('node:events');
const test = require('node:test');
const express = require('express');

async function serve(t, env = 'development') {
  const app = express();
  require('../docs/mount')(app, env);
  const server = app.listen(0, '127.0.0.1');
  t.after(() => new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  }));
  await once(server, 'listening');
  return (path) => fetch(`http://127.0.0.1:${server.address().port}${path}`);
}

test('Scalar se sirve por HTTP con el bundle local, sin CDN ni proxy', async (t) => {
  const get = await serve(t);
  const page = await get('/docs');
  assert.equal(page.status, 200);
  assert.match(page.headers.get('content-type'), /text\/html/);
  const html = await page.text();
  assert.match(html, /url: '\/openapi\.json'/);
  assert.match(html, /proxyUrl: ''/);
  assert.deepEqual([...html.matchAll(/<script src="([^"]+)"/g)].map((m) => m[1]), ['/docs/scalar.js']);
  const asset = await get('/docs/scalar.js');
  assert.equal(asset.status, 200);
  assert.match(asset.headers.get('content-type'), /javascript/);
  assert.match(await asset.text(), /createApiReference/);
});

test('OpenAPI enumera las 11 operaciones y distingue las dos públicas', async (t) => {
  const get = await serve(t);
  const response = await get('/openapi.json');
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /application\/json/);
  const spec = await response.json();
  const token = spec.components.securitySchemes.token;
  assert.deepEqual([token.type, token.in, token.name], ['apiKey', 'header', 'x-auth-token']);
  const operations = Object.entries(spec.paths).flatMap(([path, item]) =>
    Object.entries(item).map(([method, operation]) => {
      const security = operation.security ?? spec.security;
      assert.ok(operation.summary);
      assert.ok(operation.responses['200']);
      if (security.length) {
        assert.deepEqual(security, [{ token: [] }]);
        assert.ok(operation.responses['401']);
      }
      return `${method} ${path} ${security.length ? 'privada' : 'pública'}`;
    }));
  assert.deepEqual(operations.sort(), [
    'delete /api/proyectos/{id} privada', 'delete /api/tareas/{id} privada',
    'get /api/auth privada', 'get /api/proyectos privada', 'get /api/tareas privada',
    'post /api/auth pública', 'post /api/proyectos privada', 'post /api/tareas privada',
    'post /api/usuarios pública', 'put /api/proyectos/{id} privada', 'put /api/tareas/{id} privada',
  ]);
});

test('Producción no publica Scalar, su bundle ni OpenAPI', async (t) => {
  const get = await serve(t, 'production');
  for (const path of ['/docs', '/docs/scalar.js', '/openapi.json']) {
    const response = await get(path);
    assert.equal(response.status, 404, path);
    await response.text();
  }
});
