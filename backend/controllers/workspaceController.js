const WorkspaceDocument = require('../models/WorkspaceDocument');
const { Project, canAccessProject } = require('../utils/projectAccess');
const { sendExpectedOrServerError } = require('../utils/errorResponse');

const allowedKinds = new Set(['paper', 'code']);
const allowedFields = ['title', 'kind', 'language', 'content', 'overleafUrl'];
const allowedLatexEngines = new Set(['pdflatex', 'xelatex', 'lualatex']);
const allowedCodeLanguages = new Set(['javascript', 'typescript', 'python', 'java', 'c', 'cpp', 'csharp', 'go', 'rust', 'r', 'julia', 'php', 'ruby', 'sql', 'bash']);
// The application uses friendly language names while Piston uses the names of
// its installed runtimes. Keeping this map on the trusted server avoids a
// client choosing an arbitrary runtime or package command.
const runnerLanguageMap = Object.freeze({
  javascript: 'javascript',
  typescript: 'typescript',
  python: 'python',
  java: 'java',
  c: 'c',
  cpp: 'c++',
  csharp: 'csharp',
  go: 'go',
  rust: 'rust',
  r: 'rscript',
  julia: 'julia',
  php: 'php',
  ruby: 'ruby',
  sql: 'sqlite3',
  bash: 'bash'
});
const runnerFileNameMap = Object.freeze({
  javascript: 'main.js',
  typescript: 'main.ts',
  python: 'main.py',
  java: 'Main.java',
  c: 'main.c',
  cpp: 'main.cpp',
  csharp: 'Program.cs',
  go: 'main.go',
  rust: 'main.rs',
  r: 'main.R',
  julia: 'main.jl',
  php: 'main.php',
  ruby: 'main.rb',
  sql: 'main.sql',
  bash: 'main.sh'
});
const isProduction = process.env.NODE_ENV === 'production';
const maxCodeSourceChars = 150000;
const maxCodeSourceBytes = 600 * 1024;
// Vercel response bodies are substantially smaller than the compiler's local
// disk limit. A 3 MiB PDF encodes to about 4 MiB, leaving room for JSON and a
// short compiler log without a deployment-only response failure.
const maxPdfBase64Chars = 4 * 1024 * 1024 + 1024;
const maxCompilerLogChars = 50000;
const configuredRunnerLanguages = () => {
  const configured = (process.env.CODE_RUNNER_LANGUAGES || '')
    .split(',')
    .map((language) => language.trim().toLowerCase())
    .filter((language) => allowedCodeLanguages.has(language));
  return configured.length ? new Set(configured) : allowedCodeLanguages;
};

const serviceUrl = (value, endpoint) => {
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    throw new Error('Invalid service URL');
  }
  if (isProduction && url.protocol !== 'https:') throw new Error('HTTPS is required');
  if (url.pathname.replace(/\/+$/, '') !== endpoint) throw new Error('Invalid service endpoint');
  return url;
};

// Keep configuration diagnostics deliberately high-level. Project members need
// to know whether a capability is available, but must never receive a service
// host, endpoint, or shared secret.
const serviceConfiguration = (value, endpoint, secret, { requireProductionSecret = false } = {}) => {
  if (!value) return { configured: false, state: 'not_configured' };
  if (requireProductionSecret && isProduction && (!secret || secret.length < 32)) {
    return { configured: false, state: 'shared_secret_invalid' };
  }
  try {
    return { configured: true, state: 'ready', url: serviceUrl(value, endpoint) };
  } catch {
    return { configured: false, state: 'invalid_url' };
  }
};

// The code gateway exposes a deliberately small health response. Check it on
// the authenticated capability route so the client never claims that C (or
// another language) is available merely because an administrator entered a
// URL. Hosts, URLs, and response internals stay server-side.
const inspectCodeRunner = async (configuration, configuredLanguages) => {
  const base = {
    configured: configuration.configured,
    state: configuration.state,
    languages: configuredLanguages
  };
  if (!configuration.configured) return base;

  const healthUrl = new URL(configuration.url);
  healthUrl.pathname = '/health';
  healthUrl.search = '';
  healthUrl.hash = '';
  try {
    const healthResponse = await fetch(healthUrl, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(5000)
    });
    const health = healthResponse.ok ? await healthResponse.json() : null;
    if (!health?.success || health.service !== 'code-runner-gateway' || health.pistonReachable !== true || !Array.isArray(health.availableLanguages)) {
      return { ...base, configured: false, state: 'unavailable', languages: [] };
    }
    const installed = new Set(health.availableLanguages);
    return {
      ...base,
      configured: true,
      state: 'ready',
      languages: configuredLanguages.filter((language) => installed.has(runnerLanguageMap[language]))
    };
  } catch {
    return { ...base, configured: false, state: 'unavailable', languages: [] };
  }
};

const compilerConfigurationError = (state) => ({
  not_configured: {
    code: 'LATEX_COMPILER_NOT_CONFIGURED',
    error: 'Paper compilation is not configured. Ask the administrator to deploy the isolated LaTeX compiler and set LATEX_COMPILER_URL.'
  },
  shared_secret_invalid: {
    code: 'LATEX_COMPILER_SHARED_SECRET_INVALID',
    error: 'Paper compilation is not securely configured. Ask the administrator to set a matching compiler shared secret.'
  },
  invalid_url: {
    code: 'LATEX_COMPILER_INVALID_URL',
    error: 'The LaTeX compiler service is configured with an invalid URL. Ask the administrator to correct it.'
  }
}[state] || {
  code: 'LATEX_COMPILER_UNAVAILABLE',
  error: 'Paper compilation is currently unavailable. Please try again shortly.'
});

const codeRunnerConfigurationError = (state) => ({
  not_configured: {
    code: 'CODE_RUNNER_NOT_CONFIGURED',
    error: 'Code execution is not configured. Ask the administrator to deploy the isolated code runner and set CODE_RUNNER_URL.'
  },
  shared_secret_invalid: {
    code: 'CODE_RUNNER_SHARED_SECRET_INVALID',
    error: 'Code execution is not securely configured. Ask the administrator to set a matching runner shared secret.'
  },
  invalid_url: {
    code: 'CODE_RUNNER_INVALID_URL',
    error: 'The isolated code runner service is configured with an invalid URL. Ask the administrator to correct it.'
  }
}[state] || {
  code: 'CODE_RUNNER_UNAVAILABLE',
  error: 'Code execution is currently unavailable. Please try again shortly.'
});

const safeText = (value, maxLength = 30000) => typeof value === 'string' ? value.slice(-maxLength) : '';
const stageOutput = (stage) => {
  if (!stage || typeof stage !== 'object') return '';
  const output = safeText(stage.output);
  if (output) return output;
  return `${safeText(stage.stdout)}${safeText(stage.stderr)}`.slice(-30000);
};

const getAccessibleProject = async (projectId, user) => {
  const project = await Project.findById(projectId);
  if (!project) {
    const error = new Error('Project not found');
    error.statusCode = 404;
    throw error;
  }
  if (!canAccessProject(project, user)) {
    const error = new Error('Not authorized to access this project workspace');
    error.statusCode = 403;
    throw error;
  }
  return project;
};

const validateDocument = (data, partial = false) => {
  if (!partial && (!data.title || !data.kind)) {
    const error = new Error('title and kind are required');
    error.statusCode = 422;
    throw error;
  }
  if (data.kind && !allowedKinds.has(data.kind)) {
    const error = new Error('kind must be paper or code');
    error.statusCode = 422;
    throw error;
  }
  if (data.language && data.kind === 'code' && !allowedCodeLanguages.has(data.language)) {
    const error = new Error('Unsupported code language');
    error.statusCode = 422;
    throw error;
  }
  if (data.overleafUrl) {
    try {
      const url = new URL(data.overleafUrl);
      const isOverleafHost = url.hostname === 'overleaf.com' || url.hostname.endsWith('.overleaf.com');
      if (url.protocol !== 'https:' || !isOverleafHost) throw new Error('Invalid host or protocol');
    } catch {
      const error = new Error('Overleaf link must be a valid HTTPS URL on overleaf.com');
      error.statusCode = 422;
      throw error;
    }
  }
};

exports.listDocuments = async (req, res) => {
  try {
    await getAccessibleProject(req.params.projectId, req.user);
    const documents = await WorkspaceDocument.find({ project: req.params.projectId })
      .select('title kind language overleafUrl createdBy createdAt updatedAt')
      .populate('createdBy', 'name')
      .sort({ updatedAt: -1 });
    res.json({ success: true, data: documents });
  } catch (error) {
    res.status(error.statusCode || 400).json({ success: false, error: error.message });
  }
};

exports.getDocument = async (req, res) => {
  try {
    const document = await WorkspaceDocument.findById(req.params.id).populate('createdBy', 'name');
    if (!document) return res.status(404).json({ success: false, error: 'Workspace document not found' });
    await getAccessibleProject(document.project, req.user);
    res.json({ success: true, data: document });
  } catch (error) {
    res.status(error.statusCode || 400).json({ success: false, error: error.message });
  }
};

exports.createDocument = async (req, res) => {
  try {
    await getAccessibleProject(req.params.projectId, req.user);
    const data = {};
    allowedFields.forEach((field) => { if (req.body[field] !== undefined) data[field] = req.body[field]; });
    validateDocument(data);
    const document = await WorkspaceDocument.create({ ...data, project: req.params.projectId, createdBy: req.user.id });
    res.status(201).json({ success: true, data: document });
  } catch (error) {
    res.status(error.statusCode || 400).json({ success: false, error: error.message });
  }
};

exports.updateDocument = async (req, res) => {
  try {
    const document = await WorkspaceDocument.findById(req.params.id);
    if (!document) return res.status(404).json({ success: false, error: 'Workspace document not found' });
    await getAccessibleProject(document.project, req.user);
    const updates = {};
    allowedFields.forEach((field) => { if (req.body[field] !== undefined) updates[field] = req.body[field]; });
    validateDocument({ ...document.toObject(), ...updates }, true);
    const updated = await WorkspaceDocument.findByIdAndUpdate(req.params.id, updates, { returnDocument: 'after', runValidators: true });
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(error.statusCode || 400).json({ success: false, error: error.message });
  }
};

// TeX distributions are intentionally kept outside this API. A complete TeX
// installation is large and executing untrusted TeX inside a Vercel function
// would be both unreliable and unsafe. Instead, this authenticated endpoint
// sends the saved source to an administrator-configured, isolated compiler.
exports.compileDocument = async (req, res) => {
  try {
    const document = await WorkspaceDocument.findById(req.params.id);
    if (!document) return res.status(404).json({ success: false, error: 'Workspace document not found' });
    await getAccessibleProject(document.project, req.user);
    if (document.kind !== 'paper') return res.status(422).json({ success: false, error: 'Only LaTeX paper documents can be compiled' });

    const engine = req.body?.engine || 'pdflatex';
    if (!allowedLatexEngines.has(engine)) {
      return res.status(422).json({ success: false, error: 'Unsupported LaTeX engine' });
    }
    const compilerConfiguration = serviceConfiguration(
      process.env.LATEX_COMPILER_URL,
      '/compile',
      process.env.LATEX_COMPILER_SHARED_SECRET,
      { requireProductionSecret: true }
    );
    if (!compilerConfiguration.configured) {
      return res.status(503).json({ success: false, ...compilerConfigurationError(compilerConfiguration.state) });
    }
    const compilerUrl = compilerConfiguration.url;

    const headers = { 'Content-Type': 'application/json', Accept: 'application/json' };
    if (process.env.LATEX_COMPILER_SHARED_SECRET) headers['X-Compiler-Secret'] = process.env.LATEX_COMPILER_SHARED_SECRET;

    let compilerResponse;
    try {
      compilerResponse = await fetch(compilerUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({ source: document.content, engine, mainFile: 'main.tex' }),
        signal: AbortSignal.timeout(55000)
      });
    } catch {
      return res.status(502).json({ success: false, error: 'The LaTeX compiler service could not be reached. Please try again shortly.' });
    }

    let output;
    try {
      output = await compilerResponse.json();
    } catch {
      return res.status(502).json({ success: false, error: 'The LaTeX compiler returned an invalid response' });
    }
    const log = safeText(output.log, maxCompilerLogChars);
    if (!compilerResponse.ok || !output.success) {
      if (compilerResponse.status === 401 || compilerResponse.status === 403) {
        return res.status(502).json({ success: false, error: 'The LaTeX compiler rejected this service request. Ask the administrator to verify the shared secret.' });
      }
      if (compilerResponse.status === 429) {
        return res.status(429).json({ success: false, error: 'The compiler is busy. Please wait before trying again.' });
      }
      const compilerError = typeof output.error === 'string' && output.error.length <= 500
        ? output.error
        : 'LaTeX compilation failed. Review the compiler log and correct the source.';
      return res.status(422).json({ success: false, error: compilerError, data: { log } });
    }
    if (typeof output.pdfBase64 !== 'string' || output.pdfBase64.length > maxPdfBase64Chars) {
      return res.status(502).json({ success: false, error: 'The compiler returned an invalid or oversized PDF' });
    }

    res.json({
      success: true,
      data: {
        engine,
        pdfBase64: output.pdfBase64,
        log,
        compiledAt: new Date().toISOString()
      }
    });
  } catch (error) {
    return sendExpectedOrServerError(res, error, 'Unable to compile this document');
  }
};

// This deliberately reports capabilities rather than endpoints, hosts, or
// shared secrets. The client can explain unavailable tools without exposing
// deployment infrastructure to ordinary project members.
exports.getRuntimeStatus = async (req, res) => {
  try {
    const latexConfiguration = serviceConfiguration(
      process.env.LATEX_COMPILER_URL,
      '/compile',
      process.env.LATEX_COMPILER_SHARED_SECRET,
      { requireProductionSecret: true }
    );
    const codeRunnerConfiguration = serviceConfiguration(
      process.env.CODE_RUNNER_URL,
      '/execute',
      process.env.CODE_RUNNER_SHARED_SECRET,
      { requireProductionSecret: true }
    );
    const codeRunner = await inspectCodeRunner(codeRunnerConfiguration, [...configuredRunnerLanguages()]);
    return res.json({
      success: true,
      data: {
        compiler: {
          configured: latexConfiguration.configured,
          state: latexConfiguration.state,
          engines: [...allowedLatexEngines],
          maxPdfBytes: 3 * 1024 * 1024
        },
        codeRunner: {
          ...codeRunner,
          maxSourceChars: maxCodeSourceChars,
          maxSourceBytes: maxCodeSourceBytes
        },
        browserJavaScript: true
      }
    });
  } catch (error) {
    return sendExpectedOrServerError(res, error, 'Unable to load workspace runtime status');
  }
};

// Multi-language execution must happen in an isolated runner, never in the
// web server or a Vercel function. The runner contract is compatible with
// self-hosted Piston-style services.
exports.runDocument = async (req, res) => {
  try {
    const document = await WorkspaceDocument.findById(req.params.id);
    if (!document) return res.status(404).json({ success: false, error: 'Workspace document not found' });
    await getAccessibleProject(document.project, req.user);
    if (document.kind !== 'code') return res.status(422).json({ success: false, error: 'Only code documents can be executed' });
    if (!allowedCodeLanguages.has(document.language)) return res.status(422).json({ success: false, error: 'Unsupported code language' });
    if (!configuredRunnerLanguages().has(document.language)) {
      return res.status(422).json({ success: false, error: 'The selected language is not installed on the approved code runner' });
    }
    if (document.content.length > maxCodeSourceChars || Buffer.byteLength(document.content, 'utf8') > maxCodeSourceBytes) {
      return res.status(422).json({ success: false, error: `Code files must be ${maxCodeSourceChars.toLocaleString()} characters or fewer to run` });
    }
    const codeRunnerConfiguration = serviceConfiguration(
      process.env.CODE_RUNNER_URL,
      '/execute',
      process.env.CODE_RUNNER_SHARED_SECRET,
      { requireProductionSecret: true }
    );
    if (!codeRunnerConfiguration.configured) {
      return res.status(503).json({ success: false, ...codeRunnerConfigurationError(codeRunnerConfiguration.state) });
    }
    const runnerUrl = codeRunnerConfiguration.url;
    const headers = { 'Content-Type': 'application/json', Accept: 'application/json' };
    if (process.env.CODE_RUNNER_SHARED_SECRET) headers['X-Runner-Secret'] = process.env.CODE_RUNNER_SHARED_SECRET;

    let runnerResponse;
    try {
      runnerResponse = await fetch(runnerUrl, {
        method: 'POST', headers,
        body: JSON.stringify({
          language: runnerLanguageMap[document.language],
          version: '*',
          files: [{ name: runnerFileNameMap[document.language], content: document.content }],
          stdin: '',
          // The gateway also enforces these values. They are sent here so a
          // correctly configured Piston-compatible runner never receives an
          // unlimited job even if the gateway is bypassed by mistake.
          compile_timeout: 10000,
          run_timeout: 3000,
          compile_cpu_time: 8000,
          run_cpu_time: 2500,
          compile_memory_limit: 256 * 1024 * 1024,
          run_memory_limit: 128 * 1024 * 1024
        }),
        signal: AbortSignal.timeout(18000)
      });
    } catch {
      return res.status(502).json({ success: false, error: 'The isolated code runner could not be reached. Please try again shortly.' });
    }
    let output;
    try { output = await runnerResponse.json(); } catch { return res.status(502).json({ success: false, error: 'The code runner returned an invalid response' }); }
    if (!runnerResponse.ok) {
      if (runnerResponse.status === 401 || runnerResponse.status === 403) {
        return res.status(502).json({ success: false, error: 'The code runner rejected this service request. Ask the administrator to verify the shared secret.' });
      }
      if (runnerResponse.status === 429) {
        return res.status(429).json({ success: false, error: 'The code runner is busy. Please wait before trying again.' });
      }
      const runnerError = typeof output.error === 'string' && output.error.length <= 500
        ? output.error
        : 'Code execution failed. Verify that the selected runtime is installed.';
      return res.status(422).json({ success: false, error: runnerError });
    }
    const compile = output.compile || {};
    const run = output.run || output;
    res.json({ success: true, data: {
      compileOutput: stageOutput(compile),
      output: `${stageOutput(run)}${safeText(run.message, 1000) ? `\n${safeText(run.message, 1000)}` : ''}`.slice(-30000),
      exitCode: Number.isInteger(run.code) ? run.code : null,
      signal: typeof run.signal === 'string' ? run.signal.slice(0, 40) : null
    } });
  } catch (error) {
    return sendExpectedOrServerError(res, error, 'Unable to run this code');
  }
};

exports.deleteDocument = async (req, res) => {
  try {
    const document = await WorkspaceDocument.findById(req.params.id);
    if (!document) return res.status(404).json({ success: false, error: 'Workspace document not found' });
    const project = await getAccessibleProject(document.project, req.user);
    const canDelete = req.user.role === 'admin' || project.supervisor?.toString() === req.user.id || document.createdBy.toString() === req.user.id;
    if (!canDelete) return res.status(403).json({ success: false, error: 'Only the author, supervisor, or an administrator can delete this document' });
    await document.deleteOne();
    res.json({ success: true, data: {} });
  } catch (error) {
    res.status(error.statusCode || 400).json({ success: false, error: error.message });
  }
};
