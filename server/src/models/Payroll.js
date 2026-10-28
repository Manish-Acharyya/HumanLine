import mongoose from 'mongoose';

const payrollSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true, min: 2000 },
    periodLabel: { type: String, required: true },
    baseSalary: { type: Number, required: true },
    allowances: { type: Object, default: {} },
    allowanceTotal: { type: Number, default: 0 },
    overtimePay: { type: Number, default: 0 },
    unpaidLeaveDays: { type: Number, default: 0 },
    unpaidLeaveDeduction: { type: Number, default: 0 },
    grossPay: { type: Number, required: true },
    deductions: {
      tax: { type: Number, default: 0 },
      loan: { type: Number, default: 0 },
      other: { type: Number, default: 0 },
    },
    totalDeductions: { type: Number, default: 0 },
    netPay: { type: Number, required: true },
    workingDays: { type: Number, default: 30 },
    generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    payslipNo: { type: String, unique: true },
    status: { type: String, enum: ['draft', 'paid'], default: 'draft' },
  },
  { timestamps: true }
);

payrollSchema.index({ employee: 1, month: 1, year: 1 }, { unique: true });
payrollSchema.index({ month: 1, year: 1 });

const Payroll = mongoose.model('Payroll', payrollSchema);

export default Payroll;
