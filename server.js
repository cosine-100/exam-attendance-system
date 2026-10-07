require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const Department = require('./models/Department');
const User = require('./models/User');
const Course = require('./models/Course');

// Auto-create Department records from any department strings already in use,
// so existing data isn't lost when switching from free-text to a managed list.
// Safe to run on every startup - only inserts names that don't exist yet.
async function ensureDepartmentsFromExisting() {
  try {
    const userDepts = await User.distinct('department');
    const courseDepts = await Course.distinct('department');
    const names = [...new Set([...userDepts, ...courseDepts])]
      .map(n => (n || '').trim())
      .filter(Boolean);

    for (const name of names) {
      await Department.updateOne({ name }, { $setOnInsert: { name } }, { upsert: true });
    }
  } catch (err) {
    console.error('Department sync skipped:', err.message);
  }
}

// Import routes
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const teacherRoutes = require('./routes/teacher');
const studentRoutes = require('./routes/student');
const attendanceRoutes = require('./routes/attendance');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/attendance', attendanceRoutes);

// Serve frontend pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'pages', 'login.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'pages', 'admin-dashboard.html'));
});

app.get('/teacher', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'pages', 'teacher-dashboard.html'));
});

app.get('/student', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'pages', 'student-dashboard.html'));
});

// Handle 404
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found.' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error.' });
});

const PORT = process.env.PORT || 3000;
connectDB().then(async () => {
  await ensureDepartmentsFromExisting();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}).catch((err) => {
  console.error('Failed to connect to MongoDB. Server not started.', err.message);
  process.exit(1);
});
