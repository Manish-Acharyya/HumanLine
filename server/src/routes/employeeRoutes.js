import { Router } from 'express';
import * as employeeController from '../controllers/employeeController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { employeeCreateRules, employeeUpdateRules } from './validationRules.js';

const router = Router();

router.use(protect);

router.get('/', authorize('admin'), employeeController.listEmployees);
router.post('/', authorize('admin'), employeeCreateRules, validate, employeeController.createEmployee);
router.get('/:id', employeeController.getEmployee);
router.put('/:id', authorize('admin'), employeeUpdateRules, validate, employeeController.updateEmployee);
router.patch('/:id/terminate', authorize('admin'), employeeController.terminateEmployee);
router.delete('/:id', authorize('admin'), employeeController.deleteEmployee);

export default router;
