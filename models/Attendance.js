const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  exam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'flagged'],
    default: 'present'
  },
  verificationMethod: {
    type: String,
    enum: ['qr_code', 'biometric', 'manual'],
    default: 'qr_code'
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  checkInTime: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    trim: true
  },
  qrCodeData: {
    type: String
  }
}, {
  timestamps: true
});

// Prevent duplicate attendance records
attendanceSchema.index({ exam: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
