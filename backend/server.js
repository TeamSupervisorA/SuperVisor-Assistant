require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB, getDatabaseStatus } = require('./config/db');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const isProduction = process.env.NODE_ENV === 'production';
if (isProduction) {
  const missing = [];
  if (!process.env.MONGODB_URI) missing.push('MONGODB_URI');
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) missing.push('JWT_SECRET (at least 32 characters)');
  if (missing.length) {
    const message = `Missing required production environment variables: ${missing.join(', ')}`;
    console.error(message);
    throw new Error(message);
  }
}

// Begin the connection early. Every API request below also awaits this shared
// promise, preventing Mongoose's opaque "buffering timed out" errors.
connectDB().catch(() => {});

const app = express();
// Express 5 exposes `req.query` as a read-only getter.  Using the simple
// parser prevents nested query objects such as `field[$ne]` from ever reaching
// Mongoose while keeping ordinary search and pagination query strings intact.
app.set('query parser', 'simple');
if (isProduction) app.set('trust proxy', 1);
app.disable('x-powered-by');

// Middleware
app.use(helmet({
  referrerPolicy: { policy: 'no-referrer' },
  crossOriginEmbedderPolicy: false
}));
const configuredOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const isAllowedOrigin = (origin) => {
  if (!origin) return true; // CLI, health checks, and same-origin non-browser requests
  if (!configuredOrigins.length) return !isProduction;
  return configuredOrigins.includes(origin);
};
const corsOptions = {
  origin(origin, callback) {
    try {
      callback(null, isAllowedOrigin(origin));
    } catch {
      callback(null, false);
    }
  },
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));

// Rate-limit before anything that waits on MongoDB. This prevents a burst of
// unauthenticated traffic from consuming database connection capacity before
// it is rejected.
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests from this IP, please try again later' }
});

// Specific stricter limit for authentication routes. It is mounted before the
// database readiness middleware for the same reason as the general limiter.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { success: false, error: 'Too many authentication attempts, please try again later' }
});

// Readiness must wait for the shared connection promise. On a serverless cold
// start, merely reading Mongoose's immediate state can briefly report 503 even
// though the database connection is already in progress and will succeed.
app.get('/api/health', async (req, res) => {
  try {
    await connectDB();
    res.status(200).json({ success: true, database: 'connected' });
  } catch {
    res.status(503).json({ success: false, database: getDatabaseStatus() });
  }
});

app.use(limiter);
app.use('/api/auth/', authLimiter);

// A generic Mongo sanitizer that mutates req.query breaks Express 5 because
// that property is read-only. Sanitize JSON request bodies without touching
// Express-owned request properties. Iterative traversal avoids a request with
// deeply nested JSON exhausting the JavaScript call stack.
const sanitizeObject = (root) => {
  if (!root || typeof root !== 'object') return;
  const stack = [root];
  const visited = new WeakSet();
  while (stack.length) {
    const value = stack.pop();
    if (!value || typeof value !== 'object' || visited.has(value)) continue;
    visited.add(value);
    for (const key of Object.keys(value)) {
      if (key.startsWith('$') || key.includes('.') || ['__proto__', 'prototype', 'constructor'].includes(key)) {
        delete value[key];
      } else if (value[key] && typeof value[key] === 'object') {
        stack.push(value[key]);
      }
    }
  }
};
app.use((req, res, next) => {
  sanitizeObject(req.body);
  next();
});

app.use('/api', async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch {
    res.status(503).json({
      success: false,
      error: 'Database unavailable. The administrator must verify MongoDB Atlas network access and MONGODB_URI.'
    });
  }
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/projects', require('./routes/projectRoutes'));
app.use('/api', require('./routes/proposalRoutes'));
app.use('/api', require('./routes/progressRoutes'));
app.use('/api', require('./routes/reviewRoutes'));
app.use('/api', require('./routes/reportRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/evaluations', require('./routes/evaluationRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/courses', require('./routes/courseRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/teams', require('./routes/teamRoutes'));
app.use('/api/meetings', require('./routes/meetingRoutes'));
app.use('/api/resources', require('./routes/resourceRoutes'));
app.use('/api/submissions', require('./routes/submissionRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));
app.use('/api/workspace', require('./routes/workspaceRoutes'));
app.use('/api/research', require('./routes/researchRoutes'));

// Serve uploads folder as static
const path = require('path');
// Local uploads are a development-only compatibility path. Do not expose
// academic files publicly from a serverless filesystem in production.
if (!isProduction) {
  app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
    setHeaders: (res) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox");
      res.setHeader('Content-Disposition', 'attachment');
      res.setHeader('Cache-Control', 'no-store');
    }
  }));
}

// New Routes
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/plagiarism', require('./routes/plagiarismRoutes'));

// Keep API failures machine-readable for the frontend. In particular, Express
// otherwise returns an HTML page for malformed JSON and unknown API paths.
app.use('/api', (req, res) => {
  res.status(404).json({ success: false, error: 'API endpoint not found' });
});

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  if (error?.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, error: 'Invalid JSON request body' });
  }
  if (error?.type === 'entity.too.large') {
    return res.status(413).json({ success: false, error: 'Request body is too large' });
  }
  console.error('Unhandled request error:', error?.message || error);
  return res.status(500).json({ success: false, error: 'An unexpected server error occurred' });
});

const PORT = process.env.PORT || 5000;

// Don't bind a port on Vercel — serverless functions handle requests directly
if (!process.env.VERCEL) {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

// Export for Vercel Serverless Functions
module.exports = app;
