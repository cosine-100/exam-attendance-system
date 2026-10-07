const express = require('express');
const Exam = require('../models/Exam');
const Course = require('../models/Course');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate, authorize('teacher'));

// Get teacher dashboard stats
router.get('/dashboard', async (req, res) => {
  try {
    const courses = await Course.find({ teacher: req.user._id });
    const courseIds = courses.map(c => c._id);
    const exams = await Exam.find({ course: { $in: courseIds } })
      .populate('course', 'courseCode courseTitle');

    const totalStudents = new Set();
    courses.forEach(c => c.students.forEach(s => totalStudents.add(s.toString())));

    res.json({
      totalCourses: courses.length,
      totalExams: exams.length,
      totalStudents: totalStudents.size,
      upcomingExams: exams.filter(e => e.status === 'scheduled').length
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get teacher's assigned exams
router.get('/exams', async (req, res) => {
  try {
    const courses = await Course.find({ teacher: req.user._id });
    const courseIds = courses.map(c => c._id);

    const exams = await Exam.find({
      $or: [
        { course: { $in: courseIds } },
        { invigilator: req.user._id }
      ]
    })
      .populate('course', 'courseCode courseTitle')
      .sort({ examDate: -1 });

    res.json({ exams });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get registered students for an exam
router.get('/exams/:examId/students', async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.examId)
      .populate('registeredStudents', 'fullName matricNumber department level');

    if (!exam) return res.status(404).json({ message: 'Exam not found.' });

    const attendanceRecords = await Attendance.find({ exam: req.params.examId });
    const checkedInIds = attendanceRecords.map(a => a.student.toString());

    const students = exam.registeredStudents.map(s => ({
      ...s.toObject(),
      checkedIn: checkedInIds.includes(s._id.toString()),
      record: attendanceRecords.find(a => a.student.toString() === s._id.toString())
    }));

    res.json({ students, total: students.length });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
