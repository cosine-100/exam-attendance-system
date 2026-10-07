require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Course = require('./models/Course');
const Exam = require('./models/Exam');

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Course.deleteMany({});
    await Exam.deleteMany({});
    console.log('Cleared existing data');

    // Create Admin
    const admin = await User.create({
      fullName: 'Admin User',
      email: 'admin@exam.com',
      password: 'admin123',
      role: 'admin',
      staffId: 'ADM001',
      department: 'ICT',
      phone: '08012345678'
    });

    // Create Teachers
    const teacher1 = await User.create({
      fullName: 'Dr. James Okafor',
      email: 'james@exam.com',
      password: 'teacher123',
      role: 'teacher',
      staffId: 'TCH001',
      department: 'Computer Science',
      phone: '08023456789'
    });

    const teacher2 = await User.create({
      fullName: 'Prof. Ada Nwosu',
      email: 'ada@exam.com',
      password: 'teacher123',
      role: 'teacher',
      staffId: 'TCH002',
      department: 'Computer Science',
      phone: '08034567890'
    });

    // Create Students
    const students = [];
    const studentData = [
      { fullName: 'John Doe', matricNumber: 'CSC/2021/001', email: 'john@exam.com' },
      { fullName: 'Jane Smith', matricNumber: 'CSC/2021/002', email: 'jane@exam.com' },
      { fullName: 'Peter Adamu', matricNumber: 'CSC/2021/003', email: 'peter@exam.com' },
      { fullName: 'Mary Johnson', matricNumber: 'CSC/2021/004', email: 'mary@exam.com' },
      { fullName: 'David Eze', matricNumber: 'CSC/2021/005', email: 'david@exam.com' },
      { fullName: 'Grace Obi', matricNumber: 'CSC/2021/006', email: 'grace@exam.com' },
      { fullName: 'Samuel Kalu', matricNumber: 'CSC/2021/007', email: 'samuel@exam.com' },
      { fullName: 'Blessing Uche', matricNumber: 'CSC/2021/008', email: 'blessing@exam.com' },
      { fullName: 'Emmanuel Ojo', matricNumber: 'CSC/2021/009', email: 'emmanuel@exam.com' },
      { fullName: 'Favour Ike', matricNumber: 'CSC/2021/010', email: 'favour@exam.com' }
    ];

    for (const s of studentData) {
      const student = await User.create({
        ...s,
        password: 'student123',
        role: 'student',
        department: 'Computer Science',
        level: '400',
        phone: '080' + Math.floor(10000000 + Math.random() * 90000000)
      });
      students.push(student);
    }

    // Create Courses
    const course1 = await Course.create({
      courseCode: 'CSC401',
      courseTitle: 'Software Engineering',
      department: 'Computer Science',
      level: '400',
      teacher: teacher1._id,
      students: students.map(s => s._id),
      creditUnits: 3
    });

    const course2 = await Course.create({
      courseCode: 'CSC403',
      courseTitle: 'Artificial Intelligence',
      department: 'Computer Science',
      level: '400',
      teacher: teacher2._id,
      students: students.slice(0, 7).map(s => s._id),
      creditUnits: 3
    });

    const course3 = await Course.create({
      courseCode: 'CSC405',
      courseTitle: 'Computer Networks',
      department: 'Computer Science',
      level: '400',
      teacher: teacher1._id,
      students: students.slice(3).map(s => s._id),
      creditUnits: 2
    });

    // Create Exams
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    await Exam.create({
      course: course1._id,
      examDate: tomorrow,
      startTime: '09:00',
      endTime: '12:00',
      venue: 'Hall A - Main Campus',
      semester: 'Second',
      academicYear: '2025/2026',
      invigilator: teacher1._id,
      registeredStudents: students.map(s => s._id),
      status: 'scheduled',
      isAttendanceOpen: true
    });

    await Exam.create({
      course: course2._id,
      examDate: nextWeek,
      startTime: '14:00',
      endTime: '17:00',
      venue: 'Hall B - Science Block',
      semester: 'Second',
      academicYear: '2025/2026',
      invigilator: teacher2._id,
      registeredStudents: students.slice(0, 7).map(s => s._id),
      status: 'scheduled'
    });

    await Exam.create({
      course: course3._id,
      examDate: nextWeek,
      startTime: '09:00',
      endTime: '11:00',
      venue: 'Hall C - ICT Center',
      semester: 'Second',
      academicYear: '2025/2026',
      invigilator: teacher1._id,
      registeredStudents: students.slice(3).map(s => s._id),
      status: 'scheduled'
    });

    console.log('\n=== SEED COMPLETE ===');
    console.log('\nDemo Login Credentials:');
    console.log('─────────────────────────────');
    console.log('Admin:   admin@exam.com    / admin123');
    console.log('Teacher: james@exam.com    / teacher123');
    console.log('Teacher: ada@exam.com      / teacher123');
    console.log('Student: john@exam.com     / student123');
    console.log('Student: jane@exam.com     / student123');
    console.log('─────────────────────────────');
    console.log(`\n${students.length} students, 2 teachers, 1 admin, 3 courses, 3 exams created.`);

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error.message);
    process.exit(1);
  }
};

seedDB();
