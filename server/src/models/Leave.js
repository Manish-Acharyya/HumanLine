import mongoose from 'mongoose';

const leaveSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['sick', 'annual', 'casual', 'unpaid', 'maternity'],
      required: [true, 'Leave type is required'],
    },
    startDate: { type: Date, required: [true, 'Start date is required'] },
    endDate: { type: Date, required: [true, 'End date is required'] },
    reason: { type: String, required: [true, 'Reason is required'], trim: true, maxlength: 500 },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewComment: { type: String, default: '' },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

leaveSchema.pre('validate', function validateRange(next) {
  if (this.startDate && this.endDate && this.endDate < this.startDate) {
    this.invalidate('endDate', 'End date must be on or after start date');
  }
  next();
});

leaveSchema.index({ employee: 1, startDate: 1, endDate: 1 });

const Leave = mongoose.model('Leave', leaveSchema);

export default Leave;
