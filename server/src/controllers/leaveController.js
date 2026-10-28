import Employee from '../models/Employee.js';
import LeaveModel from '../models/Leave.js';
import Attendance from '../models/Attendance.js';
import ApiError from '../utils/ApiError.js';
import { EMPLOYEE_POPULATE } from '../utils/employeeAccount.js';

const MAX_LEAVE_DAYS = 60;

function dayDiff(start, end) {
  const ms = new Date(end).setHours(0, 0, 0, 0) - new Date(start).setHours(0, 0, 0, 0);
  return Math.floor(ms / 86400000) + 1;
}

export async function createLeave(req, res, next) {
  try {
    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) throw new ApiError(404, 'No employee profile is linked to your account');

    const { type, startDate, endDate, reason } = req.body;
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new ApiError(400, 'Valid start and end dates are required');
    }
    if (end < start) throw new ApiError(400, 'End date must be on or after start date');

    const days = dayDiff(start, end);
    if (days > MAX_LEAVE_DAYS) {
      throw new ApiError(400, `Leave cannot exceed ${MAX_LEAVE_DAYS} days per request`);
    }

    const overlap = await LeaveModel.findOne({
      employee: employee._id,
      status: { $in: ['pending', 'approved'] },
      startDate: { $lte: end },
      endDate: { $gte: start },
    });
    if (overlap) {
      throw new ApiError(409, 'You already have a pending or approved leave overlapping these dates');
    }

    const leave = await LeaveModel.create({
      employee: employee._id,
      type,
      startDate: start,
      endDate: end,
      reason,
    });
    await leave.populate(EMPLOYEE_POPULATE);

    res.status(201).json({
      success: true,
      message: 'Leave request submitted',
      data: leave,
    });
  } catch (err) {
    next(err);
  }
}

export async function listLeaves(req, res, next) {
  try {
    const filter = {};
    const { status, type } = req.query;

    if (req.user.role !== 'admin') {
      const employee = await Employee.findOne({ user: req.user._id });
      if (!employee) throw new ApiError(404, 'No employee profile is linked to your account');
      filter.employee = employee._id;
    } else {
      if (status) filter.status = status;
      if (type) filter.type = type;
    }

    const items = await LeaveModel.find(filter)
      .populate(EMPLOYEE_POPULATE)
      .sort({ createdAt: -1 })
      .limit(500);

    res.json({ success: true, data: items });
  } catch (err) {
    next(err);
  }
}

async function reviewLeave(req, res, next, decision) {
  try {
    const leave = await LeaveModel.findById(req.params.id);
    if (!leave) throw new ApiError(404, 'Leave request not found');
    if (leave.status !== 'pending') {
      throw new ApiError(400, `Leave request has already been ${leave.status}`);
    }

    leave.status = decision;
    leave.reviewedBy = req.user._id;
    leave.reviewComment = req.body?.comment || '';
    leave.reviewedAt = new Date();

    if (decision === 'approved') {
      const cursor = new Date(leave.startDate);
      const last = new Date(leave.endDate);
      while (cursor <= last) {
        const day = new Date(cursor);
        day.setHours(0, 0, 0, 0);
        await Attendance.updateOne(
          { employee: leave.employee, date: day },
          {
            $setOnInsert: {
              employee: leave.employee,
              date: day,
              status: 'on-leave',
              note: `${leave.type} leave (approved)`,
            },
          },
          { upsert: true }
        );
        cursor.setDate(cursor.getDate() + 1);
      }
    }

    await leave.save();
    await leave.populate(EMPLOYEE_POPULATE);

    res.json({
      success: true,
      message: `Leave request ${decision}`,
      data: leave,
    });
  } catch (err) {
    next(err);
  }
}

export function approveLeave(req, res, next) {
  return reviewLeave(req, res, next, 'approved');
}

export function rejectLeave(req, res, next) {
  return reviewLeave(req, res, next, 'rejected');
}
