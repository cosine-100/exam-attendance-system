const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  courseCode: {
    type: String,
    required: [true, 'Course code is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  courseTitle: {
    type: String,
    required: [true, 'Course title is required'],
    trim: true
  },
  department: {
    type: String,
    required: true,
    trim: true
  },
  level: {
    type: String,
    enum: ['100', '200', '300', '400', '500'],
    required: true
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  creditUnits: {
    type: Number,
    default: 3
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Course', courseSchema);
