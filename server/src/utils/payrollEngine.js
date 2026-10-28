export const DEFAULT_TAX_RATE = 0.1;
export const DEFAULT_WORKING_DAYS = 30;

function sum(values = []) {
  return values.reduce((total, value) => total + (Number(value) || 0), 0);
}

function round2(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

/**
 * Pure payroll calculation — safe to unit test and reused by the API and seed script.
 */
export function calculatePayroll({
  baseSalary = 0,
  allowances = {},
  unpaidLeaveDays = 0,
  workingDays = DEFAULT_WORKING_DAYS,
  overtimeHours = 0,
  overtimeRate = 0,
  taxRate = DEFAULT_TAX_RATE,
  loanDeduction = 0,
  otherDeductions = 0,
} = {}) {
  const base = Number(baseSalary) || 0;
  const allowanceTotal = round2(sum(Object.values(allowances)));
  const overtimePay = round2((Number(overtimeHours) || 0) * (Number(overtimeRate) || 0));
  const grossPay = round2(base + allowanceTotal + overtimePay);

  const safeWorkingDays = workingDays > 0 ? workingDays : DEFAULT_WORKING_DAYS;
  const unpaidLeaveDaysSafe = Math.max(Number(unpaidLeaveDays) || 0, 0);
  const unpaidLeaveDeduction = round2((base / safeWorkingDays) * unpaidLeaveDaysSafe);

  const tax = round2(grossPay * (Number(taxRate) || 0));
  const loan = round2(loanDeduction);
  const other = round2(otherDeductions);
  const totalDeductions = round2(unpaidLeaveDeduction + tax + loan + other);
  const netPay = Math.max(round2(grossPay - totalDeductions), 0);

  return {
    baseSalary: round2(base),
    allowances,
    allowanceTotal,
    overtimePay,
    unpaidLeaveDays: unpaidLeaveDaysSafe,
    unpaidLeaveDeduction,
    grossPay,
    deductions: { tax, loan, other },
    totalDeductions,
    netPay,
    workingDays: safeWorkingDays,
  };
}
