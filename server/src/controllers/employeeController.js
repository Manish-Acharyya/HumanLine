import User from '../models/User.js';
import Employee from '../models/Employee.js';
import Attendance from '../models/Attendance.js';
import Leave from '../models/Leave.js';
import Payroll from '../models/Payroll.js';
import ApiError from '../utils/ApiError.js';
import { sanitizeUser, sanitizeEmployee } from '../utils/sanitize.js';
import { createEmployeeWithUser } from '../utils/employeeAccount.js';
import { getPagination, buildPagination } from '../utils/pagination.js';

function escapeRegex(value = '') {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const LIST_POPULATE = { path: 'user', select: 'name email role status' };

export async function listEmployees(req, res, next) {
  try {
    const { search, department, status, employmentType } = req.query;
    const { page, limit, skip } = getPagination(req.query);

    const filter = {};
    if (department) filter.department = department;
    if (status) filter.employmentStatus = status;
    if (employmentType) filter.employmentType = employmentType;

    if (search) {
      const regex = new RegExp(escapeRegex(search), 'i');
      const matchingUsers = await User.find({
        $or: [{ name: regex }, { email: regex }],
      })
        .select('_id')
        .limit(200);

      filter.$or = [
        { user: { $in: matchingUsers.map((u) => u._id) } },
        { employeeId: regex },
        { designation: regex },
        { department: regex },
      ];
    }

    const [items, total] = await Promise.all([
      Employee.find(filter)
        .populate(LIST_POPULATE)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Employee.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: items.map(sanitizeEmployee),
      pagination: buildPagination(page, limit, total),
    });
  } catch (err) {
    next(err);
  }
}

export async function createEmployee(req, res, next) {
  try {
    const { user, employee } = await createEmployeeWithUser(req.body);
    await employee.populate(LIST_POPULATE);

    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      data: { user: sanitizeUser(user), employee: sanitizeEmployee(employee) },
    });
  } catch (err) {
    next(err);
  }
}

export async function getEmployee(req, res, next) {
  try {
    const employee = await Employee.findById(req.params.id).populate(LIST_POPULATE);
    if (!employee) throw new ApiError(404, 'Employee not found');

    const isOwner =
      req.user.role === 'admin' ||
      employee.user?._id?.toString() === req.user._id.toString();
    if (!isOwner) throw new ApiError(403, 'You can only view your own employee profile');

    res.json({ success: true, data: sanitizeEmployee(employee) });
  } catch (err) {
    next(err);
  }
}

export async function updateEmployee(req, res, next) {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) throw new ApiError(404, 'Employee not found');

    const user = await User.findById(employee.user);
    if (!user) throw new ApiError(404, 'Linked account not found');

    const allowedFields = [
      'phone',
      'address',
      'department',
      'designation',
      'employmentType',
      'dateOfJoining',
      'dateOfBirth',
      'monthlySalary',
      'allowances',
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) employee[field] = req.body[field];
    });

    if (req.body.name) user.name = String(req.body.name).trim();

    if (req.body.email) {
      const email = String(req.body.email).toLowerCase().trim();
      const taken = await User.findOne({ email, _id: { $ne: user._id } });
      if (taken) throw new ApiError(409, 'An account with this email already exists');
      user.email = email;
    }

    await Promise.all([employee.save(), user.save()]);
    await employee.populate(LIST_POPULATE);

    res.json({
      success: true,
      message: 'Employee updated successfully',
      data: sanitizeEmployee(employee),
    });
  } catch (err) {
    next(err);
  }
}

export async function terminateEmployee(req, res, next) {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) throw new ApiError(404, 'Employee not found');
    if (employee.employmentStatus === 'terminated') {
      throw new ApiError(400, 'Employee is already terminated');
    }

    employee.employmentStatus = 'terminated';
    employee.termination = {
      date: new Date(),
      reason: req.body?.reason || '',
    };
    await employee.save();

    const user = await User.findById(employee.user);
    if (user) {
      user.status = 'inactive';
      await user.save();
    }

    await employee.populate(LIST_POPULATE);

    res.json({
      success: true,
      message: 'Employee terminated. Their account has been deactivated.',
      data: sanitizeEmployee(employee),
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteEmployee(req, res, next) {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) throw new ApiError(404, 'Employee not found');
    if (employee.employmentStatus !== 'terminated') {
      throw new ApiError(400, 'Terminate the employee before deleting the record');
    }

    await Promise.all([
      Attendance.deleteMany({ employee: employee._id }),
      Leave.deleteMany({ employee: employee._id }),
      Payroll.deleteMany({ employee: employee._id }),
      Employee.findByIdAndDelete(employee._id),
      User.findByIdAndDelete(employee.user),
    ]);

    res.json({ success: true, message: 'Employee record deleted permanently' });
  } catch (err) {
    next(err);
  }
}
