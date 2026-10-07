const express = require('express');
const User = require('../models/User');
const Course = require('../models/Course');
const Exam = require('../models/Exam');
const Attendance = require('../models/Attendance');
const Department = require('../models/Department');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// All admin routes require authentication + admin role
router.use(authenticate, authorize('admin'));

// ========== DEPARTMENT MANAGEMENT ==========

// Get all departments
router.get('/departments', async (req, res) => {
  try {
    const departments = await Department.find().sort({ name: 1 });
    res.json({ departments, total: departments.length });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create department
router.post('/departments', async (req, res) => {
  try {
    const { name, code } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ message: 'Department name is required.' });

    const existing = await Department.findOne({ name: name.trim() });
    if (existing) return res.status(400).json({ message: 'Department already exists.' });

    const department = await Department.create({ name: name.trim(), code });
    res.status(201).json({ message: 'Department added successfully.', department });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete department
router.delete('/departments/:id', async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) return res.status(404).json({ message: 'Department not found.' });

    const inUse = await User.countDocuments({ department: department.name }) +
                  await Course.countDocuments({ department: department.name });
    if (inUse > 0) {
      return res.status(400).json({ message: `Cannot delete — ${inUse} record(s) still use this department.` });
    }

    await Department.findByIdAndDelete(req.params.id);
    res.json({ message: 'Department deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ========== USER MANAGEMENT ==========

// Create user (student or teacher)
router.post('/users', async (req, res) => {
  try {
    const { fullName, email, password, role, matricNumber, staffId, department, level, phone } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered.' });
    }

    const user = new User({
      fullName, email, password, role,
      matricNumber, staffId, department, level, phone
    });
    await user.save();

    res.status(201).json({
      message: `${role.charAt(0).toUpperCase() + role.slice(1)} created successfully.`,
      user: { id: user._id, fullName: user.fullName, email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all users (with optional role filter)
router.get('/users', async (req, res) => {
  try {
    const { role, department, level } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (department) filter.department = department;
    if (level) filter.level = level;

    const users = await User.find(filter).select('-password').sort({ createdAt: -1 });
    res.json({ users, total: users.length });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single user
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user
router.put('/users/:id', async (req, res) => {
  try {
    const { fullName, email, role, matricNumber, staffId, department, level, phone, isActive } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { fullName, email, role, matricNumber, staffId, department, level, phone, isActive },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json({ message: 'User updated successfully.', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json({ message: 'User deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ========== COURSE MANAGEMENT ==========

// Create course
router.post('/courses', async (req, res) => {
  try {
    const { courseCode, courseTitle, department, level, teacher, creditUnits } = req.body;
    const course = new Course({ courseCode, courseTitle, department, level, teacher, creditUnits });
    await course.save();
    res.status(201).json({ message: 'Course created successfully.', course });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Course code already exists.' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all courses
router.get('/courses', async (req, res) => {
  try {
    const courses = await Course.find()
      .populate('teacher', 'fullName staffId')
      .sort({ courseCode: 1 });
    res.json({ courses, total: courses.length });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update course
router.put('/courses/:id', async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!course) return res.status(404).json({ message: 'Course not found.' });
    res.json({ message: 'Course updated successfully.', course });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete course
router.delete('/courses/:id', async (req, res) => {
  try {
    await Course.findByIdAndDelete(req.params.id);
    res.json({ message: 'Course deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Register students to a course
router.post('/courses/:id/students', async (req, res) => {
  try {
    const { studentIds } = req.body;
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found.' });

    const newStudents = studentIds.filter(id => !course.students.includes(id));
    course.students.push(...newStudents);
    await course.save();

    res.json({ message: `${newStudents.length} student(s) registered.`, course });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ========== EXAM MANAGEMENT ==========

// Create exam
router.post('/exams', async (req, res) => {
  try {
    const { course, examDate, startTime, endTime, venue, semester, academicYear, invigilator } = req.body;

    // Auto-register course students to exam
    const courseData = await Course.findById(course);
    if (!courseData) return res.status(404).json({ message: 'Course not found.' });

    const exam = new Exam({
      course, examDate, startTime, endTime, venue,
      semester, academicYear, invigilator,
      registeredStudents: courseData.students
    });
    await exam.save();

    res.status(201).json({ message: 'Exam created successfully.', exam });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all exams
router.get('/exams', async (req, res) => {
  try {
    const exams = await Exam.find()
      .populate('course', 'courseCode courseTitle department level')
      .populate('invigilator', 'fullName staffId')
      .sort({ examDate: -1 });
    res.json({ exams, total: exams.length });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update exam
router.put('/exams/:id', async (req, res) => {
  try {
    const exam = await Exam.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!exam) return res.status(404).json({ message: 'Exam not found.' });
    res.json({ message: 'Exam updated successfully.', exam });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete exam
router.delete('/exams/:id', async (req, res) => {
  try {
    await Exam.findByIdAndDelete(req.params.id);
    await Attendance.deleteMany({ exam: req.params.id });
    res.json({ message: 'Exam and related attendance records deleted.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ========== REPORTS & DASHBOARD ==========

// Dashboard stats
router.get('/dashboard', async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalTeachers = await User.countDocuments({ role: 'teacher' });
    const totalCourses = await Course.countDocuments();
    const totalExams = await Exam.countDocuments();
    const scheduledExams = await Exam.countDocuments({ status: 'scheduled' });
    const completedExams = await Exam.countDocuments({ status: 'completed' });
    const totalAttendance = await Attendance.countDocuments({ status: 'present' });
    const flaggedAttendance = await Attendance.countDocuments({ status: 'flagged' });

    res.json({
      totalStudents, totalTeachers, totalCourses, totalExams,
      scheduledExams, completedExams, totalAttendance, flaggedAttendance
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Attendance report for an exam
router.get('/reports/exam/:examId', async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.examId)
      .populate('course', 'courseCode courseTitle')
      .populate('invigilator', 'fullName');

    if (!exam) return res.status(404).json({ message: 'Exam not found.' });

    const attendanceRecords = await Attendance.find({ exam: req.params.examId })
      .populate('student', 'fullName matricNumber department level')
      .populate('verifiedBy', 'fullName')
      .sort({ checkInTime: 1 });

    const totalRegistered = exam.registeredStudents.length;
    const totalPresent = attendanceRecords.filter(a => a.status === 'present').length;
    const totalFlagged = attendanceRecords.filter(a => a.status === 'flagged').length;
    const totalAbsent = totalRegistered - totalPresent - totalFlagged;

    res.json({
      exam, attendanceRecords,
      summary: { totalRegistered, totalPresent, totalAbsent, totalFlagged,
        attendanceRate: totalRegistered > 0 ? ((totalPresent / totalRegistered) * 100).toFixed(1) : 0
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
