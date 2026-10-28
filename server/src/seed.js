import crypto from 'crypto';
import { connectDB, disconnectDB } from './config/db.js';
import User from './models/User.js';
import Employee from './models/Employee.js';
import Attendance from './models/Attendance.js';
import Leave from './models/Leave.js';
import Payroll from './models/Payroll.js';
import { calculatePayroll } from './utils/payrollEngine.js';

//admin
const ADMIN = {
  name: 'Alice Admin',
  email: 'admin@hrms.dev',
  password: 'Admin@123',
  role: 'admin',
};

const EMPLOYEES = [
  {
    name: 'John Doe',
    email: 'john@hrms.dev',
    department: 'Engineering',
    designation: 'Senior Developer',
    phone: '+91 98765 43210',
    dateOfJoining: new Date('2023-04-10'),
    monthlySalary: 7500,
    allowances: { transport: 300, housing: 800, medical: 200 },
  },
  {
    name: 'Priya Sharma',
    email: 'priya@hrms.dev',
    department: 'Marketing',
    designation: 'Marketing Lead',
    phone: '+91 98765 43211',
    dateOfJoining: new Date('2022-08-01'),
    monthlySalary: 6800,
    allowances: { transport: 250, housing: 700, medical: 200 },
  },
  {
    name: 'Marcus Lee',
    email: 'marcus@hrms.dev',
    department: 'Finance',
    designation: 'Accountant',
    phone: '+91 98765 43212',
    dateOfJoining: new Date('2024-01-15'),
    monthlySalary: 5600,
    allowances: { transport: 200, housing: 600, medical: 150 },
  },
  {
    name: 'Sofia Ramirez',
    email: 'sofia@hrms.dev',
    department: 'HR',
    designation: 'HR Executive',
    phone: '+91 98765 43213',
    dateOfJoining: new Date('2023-11-20'),
    monthlySalary: 5200,
    allowances: { transport: 200, housing: 550, medical: 150 },
  },
  {
    name: 'David Kim',
    email: 'david@hrms.dev',
    department: 'Operations',
    designation: 'Operations Analyst',
    phone: '+91 98765 43214',
    dateOfJoining: new Date('2024-06-03'),
    monthlySalary: 4800,
    allowances: { transport: 180, housing: 500, medical: 120 },
  },
];

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function at(day, hours, minutes) {
  const d = startOfDay(day);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

async function upsertUser(data) {
  const existing = await User.findOne({ email: data.email });
  if (existing) return existing;
  return User.create(data);
}

async function upsertEmployee(userId, data) {
  const existing = await Employee.findOne({ user: userId });
  if (existing) return existing;
  return Employee.create({ user: userId, ...data });
}

async function seedAttendance(employee, days = 14) {
  let created = 0;
  for (let i = 1; i <= days; i += 1) {
    const day = new Date();
    day.setDate(day.getDate() - i);
    if (day.getDay() === 0) continue; // skip Sundays

    const late = i % 5 === 0;
    const inMinutes = late ? 15 + (i % 20) : 2 + (i % 8);
    const record = await Attendance.updateOne(
      { employee: employee._id, date: startOfDay(day) },
      {
        $setOnInsert: {
          employee: employee._id,
          date: startOfDay(day),
          clockIn: at(day, late ? 10 : 9, inMinutes),
          clockOut: at(day, 17, 30 + (i % 25)),
          status: late ? 'late' : 'present',
          workedHours: late ? 7.2 : 8.4,
        },
      },
      { upsert: true }
    );
    if (record.upsertedCount) created += 1;
  }
  return created;
}

async function seedLeaves(employees) {
  if ((await Leave.countDocuments()) > 0) return 0;

  const john = employees[0];
  const sofia = employees[3];

  const pastSickStart = new Date();
  pastSickStart.setDate(pastSickStart.getDate() - 20);
  const pastSickEnd = new Date(pastSickStart);
  pastSickEnd.setDate(pastSickEnd.getDate() + 2);

  const futureAnnualStart = new Date();
  futureAnnualStart.setDate(futureAnnualStart.getDate() + 10);
  const futureAnnualEnd = new Date(futureAnnualStart);
  futureAnnualEnd.setDate(futureAnnualEnd.getDate() + 4);

  const pastUnpaidStart = new Date();
  pastUnpaidStart.setDate(pastUnpaidStart.getDate() - 8);
  const pastUnpaidEnd = new Date(pastUnpaidStart);

  await Leave.insertMany([
    {
      employee: john._id,
      type: 'sick',
      startDate: startOfDay(pastSickStart),
      endDate: startOfDay(pastSickEnd),
      reason: 'Seasonal flu — doctor advised rest',
      status: 'approved',
      reviewedAt: new Date(),
      reviewComment: 'Get well soon',
    },
    {
      employee: sofia._id,
      type: 'annual',
      startDate: startOfDay(futureAnnualStart),
      endDate: startOfDay(futureAnnualEnd),
      reason: 'Family vacation',
      status: 'pending',
    },
    {
      employee: john._id,
      type: 'unpaid',
      startDate: startOfDay(pastUnpaidStart),
      endDate: startOfDay(pastUnpaidEnd),
      reason: 'Personal work (unpaid day)',
      status: 'approved',
      reviewedAt: new Date(),
      reviewComment: 'Approved as unpaid',
    },
  ]);
  return 3;
}

async function seedPayroll(employees, admin) {
  const now = new Date();
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const month = prev.getMonth() + 1;
  const year = prev.getFullYear();
  const workingDays = new Date(year, month, 0).getDate();
  const periodLabel = `${year}-${String(month).padStart(2, '0')}`;

  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);

  let count = 0;
  for (const employee of employees) {
    const unpaid = await Leave.find({
      employee: employee._id,
      status: 'approved',
      type: 'unpaid',
      startDate: { $lte: monthEnd },
      endDate: { $gte: monthStart },
    });

    const unpaidDays = unpaid.reduce((total, leave) => {
      const start = new Date(leave.startDate) > monthStart ? new Date(leave.startDate) : monthStart;
      const end = new Date(leave.endDate) < monthEnd ? new Date(leave.endDate) : monthEnd;
      if (start > end) return total;
      return total + (Math.floor((end - start) / 86400000) + 1);
    }, 0);

    const result = calculatePayroll({
      baseSalary: employee.monthlySalary,
      allowances: employee.allowances?.toObject?.() || employee.allowances || {},
      unpaidLeaveDays: unpaidDays,
      workingDays,
    });

    await Payroll.findOneAndUpdate(
      { employee: employee._id, month, year },
      {
        $set: {
          ...result,
          periodLabel,
          generatedBy: admin._id,
          payslipNo: `PAY-${year}${String(month).padStart(2, '0')}-${employee.employeeId}`,
          status: 'paid',
        },
      },
      { upsert: true, runValidators: true }
    );
    count += 1;
  }
  return { count, periodLabel };
}

async function seed() {
  console.log('Seeding HRMS database...');

  const admin = await upsertUser(ADMIN);
  console.log(`✓ Admin: ${admin.email}`);

  const adminEmployee = await upsertEmployee(admin._id, {
    department: 'HR',
    designation: 'HR Manager',
    phone: '+91 98765 43215',
    address: '100 Innovation Drive, Tech City',
    dateOfJoining: new Date('2021-01-05'),
    employmentType: 'full-time',
    monthlySalary: 9000,
    allowances: { transport: 400, housing: 1000, medical: 300 },
  });

  const employees = [];
  for (const data of EMPLOYEES) {
    const { name, email, ...profile } = data;
    const user = await upsertUser({
      name,
      email,
      password: crypto.randomBytes(24).toString('hex'),
      role: 'employee',
      status: 'pending',
    });
    const employee = await upsertEmployee(user._id, profile);
    employees.push(employee);
  }
  employees.push(adminEmployee);
  console.log(`✓ ${employees.length} employee accounts ready (incl. admin profile)`);

  let attendanceCount = 0;
  for (const employee of employees) {
    attendanceCount += await seedAttendance(employee);
  }
  console.log(`✓ ${attendanceCount} attendance records created`);

  const leaveCount = await seedLeaves(employees);
  console.log(`✓ ${leaveCount} leave requests created`);

  const payroll = await seedPayroll(employees, admin);
  console.log(`✓ payroll generated for ${payroll.periodLabel} (${payroll.count} payslips)`);

  console.log('\n--- Seed credentials ---');
  console.log('Admin → admin@hrms.dev / Admin@123');
  console.log('Employee accounts are created as "pending".');
  console.log('Each employee must self-register at /register with their work email to set a password.');
  console.log('-------------------------\n');
}

connectDB()
  .then(seed)
  .then(async () => {
    await disconnectDB();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('Seed failed:', err);
    await disconnectDB().catch(() => {});
    process.exit(1);
  });
