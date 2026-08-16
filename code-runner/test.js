const assert = require('assert/strict');
const http = require('http');

const listen = (server) => new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const close = (server) => new Promise((resolve) => {
  server.closeIdleConnections?.();
  server.closeAllConnections?.();
  server.close(resolve);
});

(async () => {
  let forwarded = null;
  const piston = http.createServer((req, res) => {
    if (req.method === 'GET' && req.url === '/api/v2/runtimes') {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify([{ language: 'python' }, { language: 'c' }]));
      return;
    }
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      forwarded = JSON.parse(body);
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        language: 'python', version: '3.12.0',
        run: { stdout: 'hello\n', stderr: '', code: 0, signal: null, status: null, message: null }
      }));
    });
  });
  await listen(piston);
  const pistonPort = piston.address().port;
  process.env.PISTON_URL = `http://127.0.0.1:${pistonPort}/api/v2/execute`;
  process.env.RUNNER_SHARED_SECRET = '0123456789abcdef0123456789abcdef';
  process.env.VERCEL = '1'; // prevent the module's production listener in this test
  const app = require('./server');
  const gateway = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => gateway.once('listening', resolve));
  const base = `http://127.0.0.1:${gateway.address().port}`;

  try {
    const health = await fetch(`${base}/health`);
    assert.equal(health.status, 200);
    const healthData = await health.json();
    assert.equal(healthData.success, true);
    assert.equal(healthData.pistonReachable, true);
    assert.equal(healthData.approvedRuntimeCount, 2);
    assert.deepEqual(healthData.availableLanguages, ['python', 'c']);

    const unauthorised = await fetch(`${base}/execute`, { method: 'POST' });
    assert.equal(unauthorised.status, 401);

    const forbiddenRuntime = await fetch(`${base}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Runner-Secret': process.env.RUNNER_SHARED_SECRET },
      body: JSON.stringify({ language: 'brainfuck', version: '*', files: [{ name: 'main.bf', content: '+' }] })
    });
    assert.equal(forbiddenRuntime.status, 422);

    const executed = await fetch(`${base}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Runner-Secret': process.env.RUNNER_SHARED_SECRET },
      body: JSON.stringify({ language: 'python', version: '*', files: [{ name: 'main.py', content: 'print("hello")' }], stdin: '' })
    });
    assert.equal(executed.status, 200);
    const output = await executed.json();
    assert.equal(output.success, true);
    assert.equal(output.run.stdout, 'hello\n');
    assert.deepEqual(forwarded.args, []);
    assert.equal(forwarded.run_timeout, 3000);
    assert.equal(forwarded.run_memory_limit, 128 * 1024 * 1024);

    const cExecuted = await fetch(`${base}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Runner-Secret': process.env.RUNNER_SHARED_SECRET },
      body: JSON.stringify({ language: 'c', version: '*', files: [{ name: 'main.c', content: '#include <stdio.h>\nint main(void) { puts("hello"); }' }], stdin: '' })
    });
    assert.equal(cExecuted.status, 200);
    assert.equal(forwarded.language, 'c');
    assert.equal(forwarded.files[0].name, 'main.c');
    console.log('Code runner gateway tests passed');
  } finally {
    await close(gateway);
    await close(piston);
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
