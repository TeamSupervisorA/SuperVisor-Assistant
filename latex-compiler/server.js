const crypto = require('crypto');
const express = require('express');
const rateLimit = require('express-rate-limit');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');

const run = promisify(execFile);
const app = express();
const PORT = Number(process.env.PORT || 8080);
const sharedSecret = process.env.COMPILER_SHARED_SECRET || '';
const engines = new Set(['pdflatex', 'xelatex', 'lualatex']);
// The backend returns the PDF through a Vercel function. Keep the binary below
// 3 MiB so its Base64 JSON response remains under Vercel's response limit.
const maxPdfBytes = 3 * 1024 * 1024;
const maxLogChars = 50000;

if (process.env.NODE_ENV === 'production' && sharedSecret.length < 32) {
  throw new Error('COMPILER_SHARED_SECRET must contain at least 32 characters in production');
}

if (process.env.NODE_ENV === 'production') app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(express.json({ limit: '650kb' }));
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  // The backend has tighter user-facing compile limits. This protects the
  // container when many backend workers share a proxy address.
  max: 120,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { success: false, error: 'The compiler is busy. Please wait before trying again.' }
}));

const hasValidSecret = (provided) => {
  if (!sharedSecret) return process.env.NODE_ENV !== 'production';
  const candidate = Buffer.from(provided || '');
  const expected = Buffer.from(sharedSecret);
  return candidate.length === expected.length && crypto.timingSafeEqual(candidate, expected);
};

app.get('/health', (_req, res) => res.json({ success: true, service: 'latex-compiler' }));

app.post('/compile', async (req, res) => {
  if (!hasValidSecret(req.get('X-Compiler-Secret'))) {
    return res.status(401).json({ success: false, error: 'Unauthorized compiler request' });
  }
  const { source, engine = 'pdflatex', mainFile = 'main.tex' } = req.body || {};
  if (typeof source !== 'string' || !source.trim()) {
    return res.status(422).json({ success: false, error: 'LaTeX source is required' });
  }
  if (source.length > 500000 || !engines.has(engine) || mainFile !== 'main.tex') {
    return res.status(422).json({ success: false, error: 'Invalid compiler request' });
  }

  let workspace;
  try {
    workspace = await fs.mkdtemp(path.join(os.tmpdir(), 'supervisor-latex-'));
    const texmfHome = path.join(workspace, 'texmf-home');
    const texmfVar = path.join(workspace, 'texmf-var');
    const texmfConfig = path.join(workspace, 'texmf-config');
    await Promise.all([fs.mkdir(texmfHome), fs.mkdir(texmfVar), fs.mkdir(texmfConfig)]);
    const sourcePath = path.join(workspace, mainFile);
    await fs.writeFile(sourcePath, source, { mode: 0o600 });
    const engineFlag = engine === 'xelatex' ? '-xelatex' : engine === 'lualatex' ? '-lualatex' : '-pdf';
    const { stdout = '', stderr = '' } = await run('latexmk', [
      engineFlag,
      '-norc',
      '-interaction=nonstopmode',
      '-halt-on-error',
      '-file-line-error',
      '-no-shell-escape',
      `-outdir=${workspace}`,
      mainFile
    ], {
      cwd: workspace,
      timeout: 45000,
      maxBuffer: 2 * 1024 * 1024,
      windowsHide: true,
      // Do not inherit deployment-specific TeX search paths or a writable
      // home directory. The compiler only needs its system TeX installation
      // and the request-specific workspace.
      env: {
        PATH: process.env.PATH || '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin',
        HOME: workspace,
        LANG: 'C.UTF-8',
        LC_ALL: 'C.UTF-8',
        openin_any: 'p',
        openout_any: 'p',
        TEXMFOUTPUT: workspace,
        TEXMFHOME: texmfHome,
        TEXMFVAR: texmfVar,
        TEXMFCONFIG: texmfConfig
      }
    });
    const pdf = await fs.readFile(path.join(workspace, 'main.pdf'));
    if (pdf.length > maxPdfBytes) throw new Error('The generated PDF exceeds the 3 MB delivery limit');
    if (!pdf.subarray(0, 5).equals(Buffer.from('%PDF-'))) throw new Error('The compiler did not produce a valid PDF');
    return res.json({ success: true, pdfBase64: pdf.toString('base64'), log: `${stdout}\n${stderr}`.slice(-maxLogChars) });
  } catch (error) {
    // Logs are returned to the document's authorised project members. Avoid
    // adding raw Node/process errors, which can disclose container paths.
    const log = `${error.stdout || ''}\n${error.stderr || ''}`.slice(-maxLogChars);
    return res.status(422).json({ success: false, error: 'LaTeX compilation failed. Review the compiler log and correct the source.', log });
  } finally {
    if (workspace) await fs.rm(workspace, { recursive: true, force: true }).catch(() => {});
  }
});

if (require.main === module) {
  app.listen(PORT, () => console.log(`LaTeX compiler listening on ${PORT}`));
}

module.exports = app;
