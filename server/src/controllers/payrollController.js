import Employee from '../models/Employee.js';
import Payroll from '../models/Payroll.js';
import Leave from '../models/Leave.js';
import ApiError from '../utils/ApiError.js';
import { calculatePayroll } from '../utils/payrollEngine.js';
import { EMPLOYEE_POPULATE } from '../utils/employeeAccount.js';
import { getPagination, buildPagination } from '../utils/pagination.js';

function daysInMonth(month, year) {
  return new Date(year, month, 0).getDate();
}

function countUnpaidLeaveDays(leave, month, year) {
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);
  const start = new Date(leave.startDate) > monthStart ? new Date(leave.startDate) : monthStart;
  const end = new Date(leave.endDate) < monthEnd ? new Date(leave.endDate) : monthEnd;
  if (start > end) return 0;
  return Math.floor((end.setHours(0, 0, 0, 0) - start.setHours(0, 0, 0, 0)) / 86400000) + 1;
}

function validatePeriod(month, year) {
  const m = Number(month);
  const y = Number(year);
  if (!Number.isInteger(m) || m < 1 || m > 12) throw new ApiError(400, 'Month must be 1-12');
  if (!Number.isInteger(y) || y < 2000 || y > 2100) throw new ApiError(400, 'Valid year is required');
  return { month: m, year: y };
}

export async function generatePayroll(req, res, next) {
  try {
    const { month, year } = validatePeriod(req.body.month, req.body.year);
    const workingDays = daysInMonth(month, year);
    const periodLabel = `${year}-${String(month).padStart(2, '0')}`;

    const employees = await Employee.find({ employmentStatus: 'active' });
    if (!employees.length) throw new ApiError(400, 'No active employees found');

    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);

    const unpaidLeaves = await Leave.find({
      status: 'approved',
      type: 'unpaid',
      startDate: { $lte: monthEnd },
      endDate: { $gte: monthStart },
    });

    const unpaidDaysByEmployee = unpaidLeaves.reduce((acc, leave) => {
      const key = leave.employee.toString();
      acc[key] = (acc[key] || 0) + countUnpaidLeaveDays(leave, month, year);
      return acc;
    }, {});

    let count = 0;
    for (const employee of employees) {
      const unpaidLeaveDays = unpaidDaysByEmployee[employee._id.toString()] || 0;

      const result = calculatePayroll({
        baseSalary: employee.monthlySalary,
        allowances: employee.allowances?.toObject?.() || employee.allowances || {},
        unpaidLeaveDays,
        workingDays,
      });

      await Payroll.findOneAndUpdate(
        { employee: employee._id, month, year },
        {
          $set: {
            employee: employee._id,
            month,
            year,
            periodLabel,
            ...result,
            generatedBy: req.user._id,
            payslipNo: `PAY-${year}${String(month).padStart(2, '0')}-${employee.employeeId}`,
          },
        },
        { upsert: true, new: true, runValidators: true }
      );
      count += 1;
    }

    res.status(201).json({
      success: true,
      message: `Payroll generated for ${periodLabel} (${count} employees)`,
      data: { month, year, periodLabel, count },
    });
  } catch (err) {
    next(err);
  }
}

export async function listPayroll(req, res, next) {
  try {
    const filter = {};
    const { month, year, employee: employeeQuery } = req.query;

    if (month) filter.month = Number(month);
    if (year) filter.year = Number(year);
    if (employeeQuery) filter.employee = employeeQuery;

    const { page, limit, skip } = getPagination(req.query);

    const [items, total] = await Promise.all([
      Payroll.find(filter).populate(EMPLOYEE_POPULATE).sort({ year: -1, month: -1 }).skip(skip).limit(limit),
      Payroll.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: items,
      pagination: buildPagination(page, limit, total),
    });
  } catch (err) {
    next(err);
  }
}

export async function myPayroll(req, res, next) {
  try {
    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) throw new ApiError(404, 'No employee profile is linked to your account');

    const items = await Payroll.find({ employee: employee._id })
      .populate(EMPLOYEE_POPULATE)
      .sort({ year: -1, month: -1 });

    res.json({ success: true, data: items });
  } catch (err) {
    next(err);
  }
}

export async function getPayroll(req, res, next) {
  try {
    const payroll = await Payroll.findById(req.params.id).populate(EMPLOYEE_POPULATE);
    if (!payroll) throw new ApiError(404, 'Payroll record not found');

    const isOwner =
      req.user.role === 'admin' ||
      payroll.employee?.user?._id?.toString() === req.user._id.toString();
    if (!isOwner) throw new ApiError(403, 'You can only view your own payslips');

    res.json({ success: true, data: payroll });
  } catch (err) {
    next(err);
  }
}
