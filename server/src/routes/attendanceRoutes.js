import { Router } from 'express';
import * as attendanceController from '../controllers/attendanceController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();

router.use(protect);

router.get('/today', attendanceController.getToday);
router.post('/clock-in', attendanceController.clockIn);
router.post('/clock-out', attendanceController.clockOut);
router.get('/summary', authorize('admin'), attendanceController.summary);
router.get('/', attendanceController.listAttendance);

export default router;
