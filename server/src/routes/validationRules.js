import { body } from 'express-validator';

export const employeeCreateRules = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').trim().isEmail().withMessage('A valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('department').trim().notEmpty().withMessage('Department is required'),
  body('designation').trim().notEmpty().withMessage('Designation is required'),
  body('dateOfJoining').isISO8601().withMessage('Date of joining is required'),
  body('monthlySalary').isFloat({ min: 0 }).withMessage('Monthly salary must be a positive number'),
  body('employmentType')
    .optional()
    .isIn(['full-time', 'part-time', 'contract', 'intern'])
    .withMessage('Invalid employment type'),
  body('phone').optional().trim(),
  body('address').optional().trim(),
  body('dateOfBirth').optional({ values: 'null' }).isISO8601().withMessage('Invalid date of birth'),
  body('allowances').optional().isObject().withMessage('Allowances must be an object'),
];

export const employeeUpdateRules = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('email').optional().trim().isEmail().withMessage('A valid email is required'),
  body('department').optional().trim().notEmpty().withMessage('Department cannot be empty'),
  body('designation').optional().trim().notEmpty().withMessage('Designation cannot be empty'),
  body('monthlySalary')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Monthly salary must be a positive number'),
  body('dateOfJoining').optional().isISO8601().withMessage('Invalid date of joining'),
  body('allowances').optional().isObject().withMessage('Allowances must be an object'),
];

export const leaveCreateRules = [
  body('type')
    .isIn(['sick', 'annual', 'casual', 'unpaid', 'maternity'])
    .withMessage('Invalid leave type'),
  body('startDate').isISO8601().withMessage('Start date is required'),
  body('endDate').isISO8601().withMessage('End date is required'),
  body('reason').trim().notEmpty().withMessage('Reason is required'),
];

export const payrollGenerateRules = [
  body('month').isInt({ min: 1, max: 12 }).withMessage('Month must be between 1 and 12'),
  body('year').isInt({ min: 2000, max: 2100 }).withMessage('Valid year is required'),
];
