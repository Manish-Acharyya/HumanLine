import User from '../models/User.js';
import Employee from '../models/Employee.js';
import ApiError from './ApiError.js';

export async function createEmployeeWithUser(payload) {
  const { name, email, password, ...employeeFields } = payload;

  const existing = await User.findOne({ email });
  if (existing) throw new ApiError(409, 'An account with this email already exists');

  const user = await User.create({
    name,
    email,
    password,
    role: 'employee',
    status: 'active',
  });

  try {
    const employee = await Employee.create({ user: user._id, ...employeeFields });
    return { user, employee };
  } catch (err) {
    await User.findByIdAndDelete(user._id);
    throw err;
  }
}

export const EMPLOYEE_POPULATE = {
  path: 'employee',
  select: 'employeeId designation department employmentStatus user monthlySalary allowances',
  populate: { path: 'user', select: 'name email role status' },
};
