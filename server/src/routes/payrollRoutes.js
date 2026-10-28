import { Router } from 'express';
import * as payrollController from '../controllers/payrollController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { payrollGenerateRules } from './validationRules.js';

const router = Router();

router.use(protect);

router.get('/me', payrollController.myPayroll);
router.post(
  '/generate',
  authorize('admin'),
  payrollGenerateRules,
  validate,
  payrollController.generatePayroll
);
router.get('/', authorize('admin'), payrollController.listPayroll);
router.get('/:id', payrollController.getPayroll);

export default router;
