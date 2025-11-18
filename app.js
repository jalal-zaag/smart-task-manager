const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/authRoutes');
const teamRoutes = require('./routes/teamRoutes');
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');


const app = express();

// Middleware
app.use(cors({
  origin: '*', // Allow all origins in development
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Database connection
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart_task_manager';
    
    // For local MongoDB
    if (!mongoURI.includes('mongodb+srv://')) {
      const conn = await mongoose.connect(mongoURI);
      console.log(`MongoDB Connected: ${conn.connection.host}`);
      return;
    }
    
    // For MongoDB Atlas - handle OpenSSL 3.0 compatibility
    const options = {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    };
    
    const conn = await mongoose.connect(mongoURI, options);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    console.error('\nTroubleshooting steps:');
    console.error('1. Check if MongoDB Atlas IP whitelist includes your IP');
    console.error('2. Verify database credentials are correct');
    console.error('3. Try using local MongoDB: mongodb://localhost:27017/smart_task_manager');
    console.error('\nFalling back to local MongoDB...');
    
    // Try local MongoDB as fallback
    try {
      const conn = await mongoose.connect('mongodb://localhost:27017/smart_task_manager');
      console.log(`✓ Connected to local MongoDB: ${conn.connection.host}`);
    } catch (localError) {
      console.error('Local MongoDB also unavailable. Please install MongoDB or fix Atlas connection.');
      process.exit(1);
    }
  }
};

connectDB();

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Smart Task Manager API',
    version: '1.0.0',
    endpoints: {
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        getMe: 'GET /api/auth/me'
      },
      teams: {
        create: 'POST /api/teams',
        getAll: 'GET /api/teams',
        getOne: 'GET /api/teams/:id',
        update: 'PUT /api/teams/:id',
        delete: 'DELETE /api/teams/:id',
        getWorkload: 'GET /api/teams/:id/workload',
        addMember: 'POST /api/teams/:id/members',
        updateMember: 'PUT /api/teams/:teamId/members/:memberId',
        removeMember: 'DELETE /api/teams/:teamId/members/:memberId'
      },
      projects: {
        create: 'POST /api/projects',
        getAll: 'GET /api/projects',
        getOne: 'GET /api/projects/:id',
        update: 'PUT /api/projects/:id',
        delete: 'DELETE /api/projects/:id'
      },
      tasks: {
        create: 'POST /api/tasks',
        getAll: 'GET /api/tasks (supports ?project=&member=&status=&priority=)',
        getOne: 'GET /api/tasks/:id',
        update: 'PUT /api/tasks/:id',
        delete: 'DELETE /api/tasks/:id',
        autoAssign: 'POST /api/tasks/:id/auto-assign'
      },
      dashboard: {
        getStats: 'GET /api/dashboard',
        reassignTasks: 'POST /api/dashboard/reassign-tasks',
        getActivity: 'GET /api/dashboard/activity'
      }
    }
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Server Error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
