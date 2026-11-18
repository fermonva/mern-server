const { dirname, join } = require('node:path');

module.exports = function mountDocs(app, env = process.env.NODE_ENV) {
  if (env === 'production') return;

  // Resolve Scalar's dist directory without loading its server-side module.
  const bundle = join(dirname(require.resolve('@scalar/api-reference')), 'browser', 'standalone.js');
  const spec = require('./openapi');
  app.get('/openapi.json', (req, res) => res.json(spec));
  app.get('/docs/scalar.js', (req, res) => res.sendFile(bundle));
  app.get('/docs', (req, res) => res.send(`<!doctype html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>API de proyectos y tareas</title></head>
<body>
  <div id="app"></div>
  <script src="/docs/scalar.js"></script>
  <script>Scalar.createApiReference('#app', { url: '/openapi.json', proxyUrl: '', hideClientButton: true, telemetry: false, withDefaultFonts: false })</script>
</body>
</html>`));
};
