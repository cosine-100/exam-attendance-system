const express = require('express');
const QRCode = require('qrcode');
const Exam = require('../models/Exam');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// ========== QR CODE GENERATION (Student) ==========

// Generate QR code for a student's exam
router.get('/qrcode/:examId', authenticate, authorize('student'), async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.examId).populate('course', 'courseCode courseTitle');
    if (!exam) return res.status(404).json({ message: 'Exam not found.' });

    // Check if student is registered
    const isRegistered = exam.registeredStudents.some(
      sid => sid.toString() === req.user._id.toString()
    );
    if (!isRegistered) {
      return res.status(403).json({ message: 'You are not registered for this exam.' });
    }

    // Create QR data payload
    const qrPayload = JSON.stringify({
      studentId: req.user._id,
      examId: exam._id,
      matricNumber: req.user.matricNumber,
      courseCode: exam.course.courseCode,
      timestamp: Date.now()
    });

    // Generate QR code as data URL
    const qrDataUrl = await QRCode.toDataURL(qrPayload, {
      width: 300,
      margin: 2,
      color: { dark: '#0a0e2a', light: '#ffffff' }
    });

    res.json({
      qrCode: qrDataUrl,
      examDetails: {
        courseCode: exam.course.courseCode,
        courseTitle: exam.course.courseTitle,
        examDate: exam.examDate,
        startTime: exam.startTime,
        venue: exam.venue
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ========== QR CODE VERIFICATION (Teacher) ==========

// Verify QR code and mark attendance
router.post('/verify', authenticate, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const { qrData, examId } = req.body;
    let parsed;

    try {
      parsed = JSON.parse(qrData);
    } catch {
      return res.status(400).json({ message: 'Invalid QR code data.', verified: false });
    }

    // Validate QR data structure
    if (!parsed.studentId || !parsed.examId) {
      return res.status(400).json({ message: 'Invalid QR code format.', verified: false });
    }

    // Check exam matches
    if (parsed.examId !== examId) {
      return res.status(400).json({ message: 'QR code does not match this exam.', verified: false });
    }

    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ message: 'Exam not found.', verified: false });

    if (!exam.isAttendanceOpen) {
      return res.status(400).json({ message: 'Attendance is not open for this exam.', verified: false });
    }

    // Check student is registered
    const isRegistered = exam.registeredStudents.some(
      sid => sid.toString() === parsed.studentId
    );
    if (!isRegistered) {
      return res.status(403).json({ message: 'Student is not registered for this exam.', verified: false });
    }

    // Check for duplicate attendance
    const existing = await Attendance.findOne({ exam: examId, student: parsed.studentId });
    if (existing) {
      const student = await User.findById(parsed.studentId).select('fullName matricNumber');
      return res.status(400).json({
        message: `${student.fullName} (${student.matricNumber}) already checked in.`,
        verified: false, duplicate: true
      });
    }

    // Get student info
    const student = await User.findById(parsed.studentId).select('fullName matricNumber department level');
    if (!student) {
      return res.status(404).json({ message: 'Student not found.', verified: false });
    }

    // Record attendance
    const attendance = new Attendance({
      exam: examId,
      student: parsed.studentId,
      status: 'present',
      verificationMethod: 'qr_code',
      verifiedBy: req.user._id,
      qrCodeData: qrData,
      checkInTime: new Date()
    });
    await attendance.save();

    res.json({
      message: 'Attendance verified successfully!',
      verified: true,
      student: {
        fullName: student.fullName,
        matricNumber: student.matricNumber,
        department: student.department,
        level: student.level,
        checkInTime: attendance.checkInTime
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ========== MANUAL ATTENDANCE (Teacher) ==========

// Mark attendance manually
router.post('/manual', authenticate, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const { examId, studentId, notes } = req.body;

    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ message: 'Exam not found.' });

    const existing = await Attendance.findOne({ exam: examId, student: studentId });
    if (existing) {
      return res.status(400).json({ message: 'Attendance already recorded for this student.' });
    }

    const attendance = new Attendance({
      exam: examId,
      student: studentId,
      status: 'present',
      verificationMethod: 'manual',
      verifiedBy: req.user._id,
      notes: notes || 'Manually verified by invigilator',
      checkInTime: new Date()
    });
    await attendance.save();

    const student = await User.findById(studentId).select('fullName matricNumber');
    res.json({
      message: `Attendance recorded for ${student.fullName}.`,
      attendance
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Flag a student
router.post('/flag', authenticate, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const { examId, studentId, notes } = req.body;

    const attendance = new Attendance({
      exam: examId,
      student: studentId,
      status: 'flagged',
      verificationMethod: 'manual',
      verifiedBy: req.user._id,
      notes: notes || 'Flagged for manual review'
    });
    await attendance.save();

    res.json({ message: 'Student flagged for review.', attendance });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ========== ATTENDANCE RECORDS ==========

// Get attendance for an exam
router.get('/exam/:examId', authenticate, async (req, res) => {
  try {
    const records = await Attendance.find({ exam: req.params.examId })
      .populate('student', 'fullName matricNumber department level')
      .populate('verifiedBy', 'fullName')
      .sort({ checkInTime: 1 });

    const exam = await Exam.findById(req.params.examId)
      .populate('course', 'courseCode courseTitle');

    const totalRegistered = exam ? exam.registeredStudents.length : 0;
    const present = records.filter(r => r.status === 'present').length;
    const flagged = records.filter(r => r.status === 'flagged').length;

    res.json({
      records,
      summary: {
        totalRegistered,
        present,
        absent: totalRegistered - present - flagged,
        flagged,
        attendanceRate: totalRegistered > 0 ? ((present / totalRegistered) * 100).toFixed(1) : 0
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Toggle attendance open/close for exam
router.put('/toggle/:examId', authenticate, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.examId);
    if (!exam) return res.status(404).json({ message: 'Exam not found.' });

    exam.isAttendanceOpen = !exam.isAttendanceOpen;
    if (exam.isAttendanceOpen) exam.status = 'ongoing';
    await exam.save();

    res.json({
      message: `Attendance ${exam.isAttendanceOpen ? 'opened' : 'closed'}.`,
      isAttendanceOpen: exam.isAttendanceOpen
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
