import { Router } from 'express';
import * as leaveController from '../controllers/leaveController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { leaveCreateRules } from './validationRules.js';

const router = Router();

router.use(protect);

router.get('/', leaveController.listLeaves);
router.post('/', leaveCreateRules, validate, leaveController.createLeave);
router.patch('/:id/approve', authorize('admin'), leaveController.approveLeave);
router.patch('/:id/reject', authorize('admin'), leaveController.rejectLeave);

export default router;
