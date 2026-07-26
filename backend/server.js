require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(helmet()); // Security headers
const corsOptions = {
  origin: process.env.FRONTEND_URL || '*',
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(mongoSanitize()); // Prevent NoSQL Injection

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later'
});
app.use(limiter);

// Specific stricter limit for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: 'Too many login attempts, please try again later'
});
app.use('/api/auth/', authLimiter);

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/projects', require('./routes/projectRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/evaluations', require('./routes/evaluationRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/courses', require('./routes/courseRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/teams', require('./routes/teamRoutes'));
app.use('/api/meetings', require('./routes/meetingRoutes'));
app.use('/api/resources', require('./routes/resourceRoutes'));
app.use('/api/submissions', require('./routes/submissionRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));

// Serve uploads folder as static
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('join_project', (projectId) => {
    socket.join(projectId);
    console.log(`Socket ${socket.id} joined project ${projectId}`);
  });

  socket.on('send_message', (data) => {
    // broadcast to project room
    io.to(data.project).emit('receive_message', data);
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
