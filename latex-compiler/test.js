const assert = require('assert/strict');

const close = (server) => new Promise((resolve) => {
  server.closeIdleConnections?.();
  server.closeAllConnections?.();
  server.close(resolve);
});

(async () => {
  process.env.NODE_ENV = 'test';
  process.env.COMPILER_SHARED_SECRET = '';
  let app = require('./server');
  let server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  let base = `http://127.0.0.1:${server.address().port}`;

  try {
    const missingSecret = await fetch(`${base}/compile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source: '\\documentclass{article}', engine: 'pdflatex', mainFile: 'main.tex' })
    });
    assert.equal(missingSecret.status, 401);
    assert.equal(missingSecret.headers.get('cache-control'), 'no-store');
  } finally {
    await close(server);
  }

  delete require.cache[require.resolve('./server')];
  process.env.COMPILER_SHARED_SECRET = '0123456789abcdef0123456789abcdef';
  app = require('./server');
  server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}`;

  try {
    const health = await fetch(`${base}/health`);
    assert.equal(health.status, 200);

    const unauthorised = await fetch(`${base}/compile`, { method: 'POST' });
    assert.equal(unauthorised.status, 401);

    const invalid = await fetch(`${base}/compile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Compiler-Secret': process.env.COMPILER_SHARED_SECRET },
      body: JSON.stringify({ source: 'x', engine: 'unknown', mainFile: 'main.tex' })
    });
    assert.equal(invalid.status, 422);
    console.log('LaTeX compiler request guard tests passed');
  } finally {
    await close(server);
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
