import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    date: { type: Date, required: true },
    clockIn: { type: Date },
    clockOut: { type: Date },
    status: {
      type: String,
      enum: ['present', 'late', 'on-leave', 'half-day', 'absent'],
      default: 'present',
    },
    workedHours: { type: Number, default: 0 },
    note: { type: String, default: '' },
  },
  { timestamps: true }
);

attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });
attendanceSchema.index({ date: 1 });

const Attendance = mongoose.model('Attendance', attendanceSchema);

export default Attendance;
