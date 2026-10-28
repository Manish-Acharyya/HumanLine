import { validationResult } from 'express-validator';

export function validate(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const errors = result.array().map((e) => ({ field: e.path, message: e.msg }));
  res.status(400).json({
    success: false,
    message: errors[0]?.message || 'Validation failed',
    errors,
  });
}
