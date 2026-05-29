const mongoose = require('mongoose');
const dotenv   = require('dotenv');
const User     = require('./models/User');
const AcademicConfig = require('./models/AcademicConfig');

dotenv.config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log('🌱 Connected to Atlas. Seeding...');
  await User.deleteMany({});
  await AcademicConfig.deleteMany({});

  await User.create([
    { name: 'Admin User',     username: 'admin',       email: 'admin@vemu.ac.in',    password: 'admin@123',   role: 'admin' },
    { name: 'Dr. K. Ramesh',  username: 'hod_cse',     email: 'hod@vemu.ac.in',      password: 'hod@123',     role: 'hod',     department: 'CSE' },
    { name: 'Prof. Lakshmi',  username: 'faculty1',    email: 'faculty@vemu.ac.in',  password: 'faculty@123', role: 'faculty', branch: 'CSE' },
    { name: 'Ravi Kumar',     username: '22B91A0501',  email: 'ravi@vemu.ac.in',     password: 'student@123', role: 'student', rollNo: '22B91A0501', branch: 'CSE', semester: '3', section: 'A' },
    { name: 'Priya Devi',     username: '22B91A0502',  email: 'priya@vemu.ac.in',    password: 'student@123', role: 'student', rollNo: '22B91A0502', branch: 'CSE', semester: '3', section: 'A' },
    { name: 'Sai Kiran',      username: '22B91A0503',  email: 'saikiran@vemu.ac.in', password: 'student@123', role: 'student', rollNo: '22B91A0503', branch: 'CSE', semester: '3', section: 'A' }
  ]);

  await AcademicConfig.create({
    branches:  ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT'],
    semesters: ['1','2','3','4','5','6','7','8'],
    sections:  ['A','B','C','D'],
    subjects: [
      { code: 'CS301', name: 'Data Structures',       branch: 'CSE', semester: '3' },
      { code: 'CS302', name: 'Digital Logic Design',  branch: 'CSE', semester: '3' },
      { code: 'CS303', name: 'Computer Organization', branch: 'CSE', semester: '3' },
      { code: 'CS304', name: 'Discrete Mathematics',  branch: 'CSE', semester: '3' },
      { code: 'CS305', name: 'OOP with Java',         branch: 'CSE', semester: '3' }
    ],
    markLimits:         { midExam: 25, assignment: 5, totalInternal: 30 },
    bestOfTwoWeightage: { best: 80, second: 20 }
  });

  console.log('✅ Seeding done!');
  console.log('admin / admin@123');
  console.log('hod_cse / hod@123');
  console.log('faculty1 / faculty@123');
  console.log('22B91A0501 / student@123');
  process.exit(0);
}).catch(err => { console.error(err); process.exit(1); });