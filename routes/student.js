const express = require('express');
const Exam = require('../models/Exam');
const Course = require('../models/Course');
const Attendance = require('../models/Attendance');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate, authorize('student'));

// Student dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const courses = await Course.find({ students: req.user._id });
    const courseIds = courses.map(c => c._id);

    const exams = await Exam.find({ registeredStudents: req.user._id })
      .populate('course', 'courseCode courseTitle')
      .sort({ examDate: -1 });

    const attendanceRecords = await Attendance.find({ student: req.user._id });

    res.json({
      totalCourses: courses.length,
      totalExams: exams.length,
      examsAttended: attendanceRecords.filter(a => a.status === 'present').length,
      upcomingExams: exams.filter(e => e.status === 'scheduled').length
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get student's registered exams
router.get('/exams', async (req, res) => {
  try {
    const exams = await Exam.find({ registeredStudents: req.user._id })
      .populate('course', 'courseCode courseTitle')
      .populate('invigilator', 'fullName')
      .sort({ examDate: -1 });

    // Add attendance status to each exam
    const examsWithStatus = await Promise.all(exams.map(async (exam) => {
      const attendance = await Attendance.findOne({
        exam: exam._id, student: req.user._id
      });
      return {
        ...exam.toObject(),
        attendanceStatus: attendance ? attendance.status : 'pending'
      };
    }));

    res.json({ exams: examsWithStatus });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get student's attendance history
router.get('/attendance', async (req, res) => {
  try {
    const records = await Attendance.find({ student: req.user._id })
      .populate({
        path: 'exam',
        populate: { path: 'course', select: 'courseCode courseTitle' }
      })
      .sort({ checkInTime: -1 });

    res.json({ records });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
