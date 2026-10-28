import mongoose from 'mongoose';

const allowanceSchema = new mongoose.Schema(
  {
    transport: { type: Number, default: 0, min: 0 },
    housing: { type: Number, default: 0, min: 0 },
    medical: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const employeeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    employeeId: { type: String, unique: true },
    department: { type: String, required: [true, 'Department is required'], trim: true },
    designation: { type: String, required: [true, 'Designation is required'], trim: true },
    phone: { type: String, trim: true, default: '' },
    address: { type: String, trim: true, default: '' },
    dateOfBirth: { type: Date },
    dateOfJoining: { type: Date, required: [true, 'Date of joining is required'] },
    employmentType: {
      type: String,
      enum: ['full-time', 'part-time', 'contract', 'intern'],
      default: 'full-time',
    },
    employmentStatus: {
      type: String,
      enum: ['active', 'terminated'],
      default: 'active',
    },
    termination: {
      date: Date,
      reason: { type: String, default: '' },
    },
    monthlySalary: { type: Number, required: [true, 'Monthly salary is required'], min: 0 },
    allowances: { type: allowanceSchema, default: () => ({}) },
  },
  { timestamps: true }
);

employeeSchema.pre('validate', async function assignEmployeeId(next) {
  if (this.employeeId) return next();
  try {
    const count = await mongoose.model('Employee').countDocuments();
    this.employeeId = `EMP-${String(count + 1).padStart(4, '0')}`;
    return next();
  } catch (err) {
    return next(err);
  }
});

employeeSchema.index({ department: 1 });
employeeSchema.index({ employmentStatus: 1 });

const Employee = mongoose.model('Employee', employeeSchema);

export default Employee;
