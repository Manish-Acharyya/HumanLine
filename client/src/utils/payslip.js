import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import { COMPANY_ADDRESS, COMPANY_NAME } from './constants.js';
import { employeeName, formatDate, formatMoney } from './formatters.js';

const pdfMoney = (value) => formatMoney(value).replace('₹', 'Rs. ');

function cell(doc, text, x, y, options = {}) {
  doc.setFontSize(options.size || 10);
  doc.setFont('helvetica', options.bold ? 'bold' : 'normal');
  doc.setTextColor(options.color || 30);
  doc.text(String(text), x, y);
}

export function generatePayslipPdf({ payroll, employee: employeeOverride }) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const employee = employeeOverride || payroll.employee;
  const left = 48;
  const width = doc.internal.pageSize.getWidth();

  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, width, 84, 'F');

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(COMPANY_NAME, left, 38);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(COMPANY_ADDRESS, left, 54);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('PAYSLIP', width - left, 42, { align: 'right' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(payroll.periodLabel || '', width - left, 58, { align: 'right' });

  let y = 116;
  cell(doc, 'Employee', left, y, { size: 8, color: 110 });
  cell(doc, employeeName(employee), left + 80, y, { bold: true });
  cell(doc, 'Payslip No.', width / 2 + 20, y, { size: 8, color: 110 });
  cell(doc, payroll.payslipNo || '—', width / 2 + 95, y, { bold: true });

  y += 16;
  cell(doc, 'Employee ID', left, y, { size: 8, color: 110 });
  cell(doc, employee?.employeeId || '—', left + 80, y);
  cell(doc, 'Department', width / 2 + 20, y, { size: 8, color: 110 });
  cell(doc, employee?.department || '—', width / 2 + 95, y);

  y += 16;
  cell(doc, 'Designation', left, y, { size: 8, color: 110 });
  cell(doc, employee?.designation || '—', left + 80, y);
  cell(doc, 'Generated', width / 2 + 20, y, { size: 8, color: 110 });
  cell(doc, formatDate(payroll.createdAt), width / 2 + 95, y);

  const earnings = [
    ['Basic salary', pdfMoney(payroll.baseSalary)],
    ...Object.entries(payroll.allowances || {}).map(([key, value]) => [
      `Allowance — ${key}`,
      pdfMoney(value),
    ]),
    ['Overtime pay', pdfMoney(payroll.overtimePay)],
    ['GROSS PAY', pdfMoney(payroll.grossPay)],
  ];

  const deductions = [
    [
      `Unpaid leave (${payroll.unpaidLeaveDays || 0} day${payroll.unpaidLeaveDays === 1 ? '' : 's'})`,
      `-${pdfMoney(payroll.unpaidLeaveDeduction)}`,
    ],
    ['Income tax', `-${pdfMoney(payroll.deductions?.tax)}`],
    ['Loans & advances', `-${pdfMoney(payroll.deductions?.loan)}`],
    ['Other deductions', `-${pdfMoney(payroll.deductions?.other)}`],
    ['TOTAL DEDUCTIONS', `-${pdfMoney(payroll.totalDeductions)}`],
  ];

  autoTable(doc, {
    startY: y + 24,
    head: [['Earnings', 'Amount']],
    body: earnings,
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 6, textColor: [40, 40, 40] },
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
    columnStyles: { 1: { halign: 'right' } },
    margin: { left, right: width / 2 - 10 },
    didParseCell: (data) => {
      if (data.section === 'body' && data.row.index === earnings.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [239, 246, 255];
      }
    },
  });

  autoTable(doc, {
    startY: y + 24,
    head: [['Deductions', 'Amount']],
    body: deductions,
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 6, textColor: [40, 40, 40] },
    headStyles: { fillColor: [100, 116, 139], textColor: 255, fontStyle: 'bold' },
    columnStyles: { 1: { halign: 'right' } },
    margin: { left: width / 2 + 10, right: left },
    didParseCell: (data) => {
      if (data.section === 'body' && data.row.index === deductions.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [241, 245, 249];
      }
    },
  });

  const finalY = Math.max(doc.lastAutoTable?.finalY || 300, 300) + 36;
  doc.setFillColor(16, 185, 129);
  doc.roundedRect(left, finalY, width - left * 2, 44, 8, 8, 'F');
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('NET PAY', left + 16, finalY + 27);
  doc.text(pdfMoney(payroll.netPay), width - left - 16, finalY + 27, { align: 'right' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120);
  doc.text(
    `Working days: ${payroll.workingDays} · Status: ${payroll.status} · This is a system-generated payslip.`,
    left,
    finalY + 70
  );

  doc.save(`${payroll.payslipNo || 'payslip'}.pdf`);
}

export default generatePayslipPdf;
