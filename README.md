# Digital Examination Attendance Management and Verification System

A web-based system for managing and verifying student attendance during examinations using QR code technology.

## Features

- **Role-Based Access**: Admin, Teacher, and Student dashboards
- **QR Code Verification**: Students generate unique QR codes per exam; teachers scan to verify
- **Manual Verification**: Fallback for when QR scanning isn't possible
- **Real-Time Attendance**: Live feed of check-ins during exams
- **Attendance Reports**: Detailed reports with statistics per exam
- **Course & Exam Management**: Full CRUD for courses, exams, and users
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express.js
- **Database**: MongoDB (with Mongoose ODM)
- **Authentication**: JWT (JSON Web Tokens)
- **QR Code**: `qrcode` npm package

## Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher)
- [MongoDB](https://www.mongodb.com/try/download/community) (running locally or MongoDB Atlas)

## Installation

1. **Clone or extract the project**

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   Edit the `.env` file:
   ```
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/exam_attendance_db
   JWT_SECRET=your_secret_key_here
   JWT_EXPIRES_IN=24h
   ```

4. **Seed the database with demo data:**
   ```bash
   npm run seed
   ```

5. **Start the server:**
   ```bash
   npm start
   ```
   Or with auto-reload:
   ```bash
   npm run dev
   ```

6. **Open in browser:**
   ```
   http://localhost:3000
   ```

## Demo Login Credentials

| Role    | Email             | Password    |
|---------|-------------------|-------------|
| Admin   | admin@exam.com    | admin123    |
| Teacher | james@exam.com    | teacher123  |
| Teacher | ada@exam.com      | teacher123  |
| Student | john@exam.com     | student123  |
| Student | jane@exam.com     | student123  |

## How It Works

1. **Admin** sets up students, teachers, courses, and schedules exams
2. **Students** log in and generate a unique QR code for each exam
3. **Teachers** open attendance for an exam, then scan student QR codes
4. The system verifies the QR code and records attendance with a timestamp
5. **Reports** show attendance statistics per exam

## Project Structure

```
exam-attendance-system/
├── server.js              # Express server entry point
├── seed.js                # Database seeder with demo data
├── .env                   # Environment variables
├── config/
│   └── db.js              # MongoDB connection
├── models/
│   ├── User.js            # User model (admin/teacher/student)
│   ├── Course.js          # Course model
│   ├── Exam.js            # Exam model
│   └── Attendance.js      # Attendance records model
├── routes/
│   ├── auth.js            # Login & authentication
│   ├── admin.js           # Admin management routes
│   ├── teacher.js         # Teacher dashboard routes
│   ├── student.js         # Student dashboard routes
│   └── attendance.js      # QR code & attendance routes
├── middleware/
│   └── auth.js            # JWT auth & role middleware
└── public/
    ├── css/style.css      # Stylesheet
    ├── js/utils.js        # Shared utilities
    └── pages/
        ├── login.html             # Login page
        ├── admin-dashboard.html   # Admin panel
        ├── teacher-dashboard.html # Teacher panel
        └── student-dashboard.html # Student panel
```

## API Endpoints

### Auth
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get profile

### Admin
- `GET/POST /api/admin/users` - List/Create users
- `PUT/DELETE /api/admin/users/:id` - Update/Delete user
- `GET/POST /api/admin/courses` - List/Create courses
- `GET/POST /api/admin/exams` - List/Create exams
- `GET /api/admin/dashboard` - Dashboard stats
- `GET /api/admin/reports/exam/:id` - Exam report

### Attendance
- `GET /api/attendance/qrcode/:examId` - Generate QR code
- `POST /api/attendance/verify` - Verify QR & record attendance
- `POST /api/attendance/manual` - Manual attendance
- `GET /api/attendance/exam/:examId` - Exam attendance records
- `PUT /api/attendance/toggle/:examId` - Open/Close attendance

## License

This project was built as a Final Year Project for Computer Science.
