import Employee from '../models/Employee.js';
import Attendance from '../models/Attendance.js';
import ApiError from '../utils/ApiError.js';
import { EMPLOYEE_POPULATE } from '../utils/employeeAccount.js';

const LATE_AFTER_HOUR = 10;

export function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date = new Date()) {
  const d = startOfDay(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

async function getOwnEmployee(user) {
  const employee = await Employee.findOne({ user: user._id });
  if (!employee) throw new ApiError(404, 'No employee profile is linked to your account');
  return employee;
}

export async function getToday(req, res, next) {
  try {
    const employee = await getOwnEmployee(req.user);
    const record = await Attendance.findOne({ employee: employee._id, date: startOfDay() });

    res.json({
      success: true,
      data: {
        record: record || null,
        canClockIn: !record?.clockIn,
        canClockOut: Boolean(record?.clockIn) && !record?.clockOut,
        employee,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function clockIn(req, res, next) {
  try {
    const employee = await getOwnEmployee(req.user);
    const today = startOfDay();

    const existing = await Attendance.findOne({ employee: employee._id, date: today });
    if (existing?.clockIn) {
      throw new ApiError(400, 'You have already clocked in today');
    }

    const now = new Date();
    const isLate = now.getHours() >= LATE_AFTER_HOUR;

    const record = await Attendance.findOneAndUpdate(
      { employee: employee._id, date: today },
      {
        $set: {
          clockIn: now,
          status: isLate ? 'late' : 'present',
          note: req.body?.note || '',
        },
        $setOnInsert: { employee: employee._id, date: today },
      },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(201).json({
      success: true,
      message: isLate ? 'Clocked in (marked late)' : 'Clocked in successfully',
      data: record,
    });
  } catch (err) {
    next(err);
  }
}

export async function clockOut(req, res, next) {
  try {
    const employee = await getOwnEmployee(req.user);
    const today = startOfDay();

    const record = await Attendance.findOne({ employee: employee._id, date: today });
    if (!record || !record.clockIn) throw new ApiError(400, 'You have not clocked in today');
    if (record.clockOut) throw new ApiError(400, 'You have already clocked out today');

    const now = new Date();
    record.clockOut = now;
    record.workedHours = Math.round(((now - record.clockIn) / 3600000) * 100) / 100;
    if (req.body?.note) record.note = req.body.note;
    await record.save();

    res.json({
      success: true,
      message: `Clocked out — ${record.workedHours}h worked`,
      data: record,
    });
  } catch (err) {
    next(err);
  }
}

export async function listAttendance(req, res, next) {
  try {
    const filter = {};
    const { employee: employeeQuery, from, to, status } = req.query;

    if (req.user.role !== 'admin') {
      const employee = await getOwnEmployee(req.user);
      filter.employee = employee._id;
    } else if (employeeQuery) {
      filter.employee = employeeQuery;
    }

    if (status) filter.status = status;
    if (from) filter.date = { ...filter.date, $gte: startOfDay(new Date(from)) };
    if (to) filter.date = { ...filter.date, $lte: endOfDay(new Date(to)) };

    const items = await Attendance.find(filter)
      .populate(EMP_POPULATE())
      .sort({ date: -1 })
      .limit(500);

    res.json({ success: true, data: items });
  } catch (err) {
    next(err);
  }
}

export async function summary(req, res, next) {
  try {
    const today = startOfDay();

    const [presentAgg, onLeaveAgg, lateAgg, activeEmployees] = await Promise.all([
      Attendance.countDocuments({ date: today, status: { $in: ['present', 'late'] } }),
      Attendance.countDocuments({ date: today, status: 'on-leave' }),
      Attendance.countDocuments({ date: today, status: 'late' }),
      Employee.countDocuments({ employmentStatus: 'active' }),
    ]);

    const present = presentAgg;
    const absent = Math.max(activeEmployees - present - onLeaveAgg, 0);

    res.json({
      success: true,
      data: { totalEmployees: activeEmployees, present, late: lateAgg, onLeave: onLeaveAgg, absent },
    });
  } catch (err) {
    next(err);
  }
}

function EMP_POPULATE() {
  return {
    path: 'employee',
    select: 'employeeId designation department user',
    populate: { path: 'user', select: 'name email' },
  };
}
