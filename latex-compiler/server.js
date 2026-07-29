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

if (process.env.NODE_ENV === 'production' && sharedSecret.length < 32) {
  throw new Error('COMPILER_SHARED_SECRET must contain at least 32 characters in production');
}

app.disable('x-powered-by');
app.use(express.json({ limit: '650kb' }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 30, standardHeaders: 'draft-8', legacyHeaders: false }));

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
    const sourcePath = path.join(workspace, mainFile);
    await fs.writeFile(sourcePath, source, { mode: 0o600 });
    const engineFlag = engine === 'xelatex' ? '-xelatex' : engine === 'lualatex' ? '-lualatex' : '-pdf';
    const { stdout = '', stderr = '' } = await run('latexmk', [
      engineFlag,
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
      env: { ...process.env, openin_any: 'p', openout_any: 'p', TEXMFOUTPUT: workspace }
    });
    const pdf = await fs.readFile(path.join(workspace, 'main.pdf'));
    if (pdf.length > 12 * 1024 * 1024) throw new Error('The generated PDF exceeds the 12 MB limit');
    return res.json({ success: true, pdfBase64: pdf.toString('base64'), log: `${stdout}\n${stderr}`.slice(-50000) });
  } catch (error) {
    const log = `${error.stdout || ''}\n${error.stderr || ''}\n${error.message || ''}`.slice(-50000);
    return res.status(422).json({ success: false, error: 'LaTeX compilation failed. Review the compiler log and correct the source.', log });
  } finally {
    if (workspace) await fs.rm(workspace, { recursive: true, force: true }).catch(() => {});
  }
});

app.listen(PORT, () => console.log(`LaTeX compiler listening on ${PORT}`));
