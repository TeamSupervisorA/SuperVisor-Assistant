const crypto = require('crypto');
const express = require('express');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = Number(process.env.PORT || 8080);
const sharedSecret = process.env.RUNNER_SHARED_SECRET || '';
const pistonUrlValue = process.env.PISTON_URL || '';
const maxSourceChars = 150000;
const maxSourceBytes = 600 * 1024;
const maxStdinChars = 4096;
const maxOutputChars = 30000;
const allowedLanguages = new Set([
  'javascript', 'typescript', 'python', 'java', 'c', 'c++', 'csharp',
  'go', 'rust', 'rscript', 'julia', 'php', 'ruby', 'sqlite3', 'bash'
]);

const parsePistonUrl = (value) => {
  if (!value) return null;
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.pathname.replace(/\/+$/, '') !== '/api/v2/execute') {
    throw new Error('PISTON_URL must be an HTTP(S) /api/v2/execute endpoint without credentials');
  }
  return url;
};

let pistonUrl;
let pistonRuntimesUrl;
try {
  pistonUrl = parsePistonUrl(pistonUrlValue);
  if (pistonUrl) {
    pistonRuntimesUrl = new URL(pistonUrl);
    pistonRuntimesUrl.pathname = '/api/v2/runtimes';
    pistonRuntimesUrl.search = '';
  }
} catch (error) {
  console.error('Invalid PISTON_URL:', error.message);
}

if (process.env.NODE_ENV === 'production' && sharedSecret.length < 32) {
  throw new Error('RUNNER_SHARED_SECRET must contain at least 32 characters in production');
}

if (process.env.NODE_ENV === 'production') app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(express.json({ limit: '650kb' }));
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { success: false, error: 'The code runner is busy. Please wait before trying again.' }
}));

const hasValidSecret = (provided) => {
  // Do not fail open when a deployment is missing its secret. The gateway
  // forwards arbitrary source code and must always require authentication.
  if (!sharedSecret) return false;
  const candidate = Buffer.from(provided || '');
  const expected = Buffer.from(sharedSecret);
  return candidate.length === expected.length && crypto.timingSafeEqual(candidate, expected);
};

const trimText = (value, maxLength = maxOutputChars) => typeof value === 'string' ? value.slice(-maxLength) : '';
const sanitiseStage = (stage) => {
  if (!stage || typeof stage !== 'object') return undefined;
  return {
    stdout: trimText(stage.stdout),
    stderr: trimText(stage.stderr),
    output: trimText(stage.output),
    code: Number.isInteger(stage.code) ? stage.code : null,
    signal: typeof stage.signal === 'string' ? stage.signal.slice(0, 40) : null,
    status: typeof stage.status === 'string' ? stage.status.slice(0, 8) : null,
    message: trimText(stage.message, 1000)
  };
};

app.get('/health', async (_req, res) => {
  if (!pistonUrl || !pistonRuntimesUrl) {
    return res.status(503).json({
      success: false,
      service: 'code-runner-gateway',
      pistonConfigured: false,
      pistonReachable: false
    });
  }
  try {
    const pistonResponse = await fetch(pistonRuntimesUrl, {
      headers: { Accept: 'application/json' },
      // PISTON_URL is validated at startup. Refusing redirects prevents a
      // compromised or misconfigured private service from redirecting health
      // checks or source code to another host.
      redirect: 'error',
      signal: AbortSignal.timeout(5000)
    });
    const runtimes = pistonResponse.ok ? await pistonResponse.json() : null;
    if (!Array.isArray(runtimes)) throw new Error('Invalid runtime response');
    const installed = new Set(runtimes.map((runtime) => runtime?.language).filter(Boolean));
    const availableLanguages = [...allowedLanguages].filter((language) => installed.has(language));
    return res.json({
      success: true,
      service: 'code-runner-gateway',
      pistonConfigured: true,
      pistonReachable: true,
      // This contains only the gateway's approved intersection with Piston's
      // installed runtimes. It lets the application avoid advertising a
      // language that the sandbox cannot actually run.
      availableLanguages,
      approvedRuntimeCount: availableLanguages.length
    });
  } catch {
    return res.status(503).json({
      success: false,
      service: 'code-runner-gateway',
      pistonConfigured: true,
      pistonReachable: false
    });
  }
});

app.post('/execute', async (req, res) => {
  if (!hasValidSecret(req.get('X-Runner-Secret'))) {
    return res.status(401).json({ success: false, error: 'Unauthorized code runner request' });
  }
  if (!pistonUrl) {
    return res.status(503).json({ success: false, error: 'The private execution service is not configured' });
  }

  const { language, version, files, stdin = '' } = req.body || {};
  const mainFile = Array.isArray(files) && files.length === 1 ? files[0] : null;
  if (
    !allowedLanguages.has(language) ||
    version !== '*' ||
    !mainFile ||
    typeof mainFile.name !== 'string' || !/^[A-Za-z0-9_.-]{1,80}$/.test(mainFile.name) ||
    typeof mainFile.content !== 'string' || mainFile.content.length > maxSourceChars || Buffer.byteLength(mainFile.content, 'utf8') > maxSourceBytes ||
    typeof stdin !== 'string' || stdin.length > maxStdinChars
  ) {
    return res.status(422).json({ success: false, error: 'Invalid code execution request' });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 16000);
  try {
    const pistonResponse = await fetch(pistonUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        language,
        version: '*',
        files: [{ name: mainFile.name, content: mainFile.content }],
        stdin,
        args: [],
        compile_timeout: 10000,
        run_timeout: 3000,
        compile_cpu_time: 8000,
        run_cpu_time: 2500,
        compile_memory_limit: 256 * 1024 * 1024,
        run_memory_limit: 128 * 1024 * 1024
      }),
      redirect: 'error',
      signal: controller.signal
    });
    let output;
    try {
      output = await pistonResponse.json();
    } catch {
      return res.status(502).json({ success: false, error: 'The private execution service returned an invalid response' });
    }
    if (!pistonResponse.ok) {
      const status = pistonResponse.status === 429 ? 429 : 422;
      const error = pistonResponse.status >= 500
        ? 'The private execution service is temporarily unavailable'
        : 'The selected runtime is not available on the approved code runner';
      return res.status(status).json({ success: false, error });
    }
    return res.json({
      success: true,
      language: typeof output.language === 'string' ? output.language.slice(0, 40) : language,
      version: typeof output.version === 'string' ? output.version.slice(0, 40) : '',
      compile: sanitiseStage(output.compile),
      run: sanitiseStage(output.run)
    });
  } catch (error) {
    const message = error?.name === 'AbortError'
      ? 'The code execution service timed out'
      : 'The private execution service could not be reached';
    return res.status(502).json({ success: false, error: message });
  } finally {
    clearTimeout(timeout);
  }
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => console.log(`Code runner gateway listening on ${PORT}`));
}

module.exports = app;
