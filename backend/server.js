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

app.get('/api/health', (req, res) => {
  res.status(getDatabaseStatus() === 'connected' ? 200 : 503).json({
    success: getDatabaseStatus() === 'connected',
    database: getDatabaseStatus()
  });
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

// express-mongo-sanitize mutates req.query, which is read-only in Express 5 and
// causes every request to fail. Sanitize JSON request bodies without touching
// Express-owned request properties.
const sanitizeObject = (value) => {
  if (!value || typeof value !== 'object') return;
  for (const key of Object.keys(value)) {
    if (key.startsWith('$') || key.includes('.')) {
      delete value[key];
    } else {
      sanitizeObject(value[key]);
    }
  }
};
app.use((req, res, next) => {
  sanitizeObject(req.body);
  next();
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests from this IP, please try again later' }
});
app.use(limiter);

// Specific stricter limit for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { success: false, error: 'Too many authentication attempts, please try again later' }
});
app.use('/api/auth/', authLimiter);

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

const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Project = require('./models/Project');

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => callback(null, isAllowedOrigin(origin)),
    methods: ['GET', 'POST']
  }
});

const canAccessSocketProject = (project, user) =>
  Boolean(project) && (user.role === 'admin' ||
  project.supervisor?.toString() === user.id ||
  project.students.some((student) => student.toString() === user.id));

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || user.status === 'inactive') return next(new Error('Authentication required'));
    socket.user = user;
    next();
  } catch {
    next(new Error('Authentication required'));
  }
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('join_project', async (projectId) => {
    const project = await Project.findById(projectId);
    if (!canAccessSocketProject(project, socket.user)) {
      return socket.emit('socket_error', 'Not authorized to join this project');
    }
    socket.join(projectId);
  });

  socket.on('send_message', async (data) => {
    const project = await Project.findById(data?.project);
    if (!canAccessSocketProject(project, socket.user)) {
      return socket.emit('socket_error', 'Not authorized to send to this project');
    }
    socket.to(data.project).emit('receive_message', data);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Make io accessible to routers
app.set('io', io);

// New Routes
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/plagiarism', require('./routes/plagiarismRoutes'));

const PORT = process.env.PORT || 5000;

// Don't bind a port on Vercel — serverless functions handle requests directly
if (!process.env.VERCEL) {
  server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

// Export for Vercel Serverless Functions
module.exports = app;
