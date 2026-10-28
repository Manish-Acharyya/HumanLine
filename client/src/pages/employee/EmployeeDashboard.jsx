import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plane, Wallet, CalendarCheck, ArrowRight } from 'lucide-react';
import PageContainer from '../../components/PageContainer.jsx';
import StatCard from '../../components/ui/StatCard.jsx';
import Badge, { statusVariant } from '../../components/ui/Badge.jsx';
import AttendanceClockCard from '../../components/features/AttendanceClockCard.jsx';
import Button from '../../components/ui/Button.jsx';
import { Table, Thead, Tbody, Tr, Th, Td } from '../../components/ui/Table.jsx';
import * as attendanceService from '../../services/attendance.js';
import * as leavesService from '../../services/leaves.js';
import * as payrollService from '../../services/payroll.js';
import { getErrorMessage, isNoProfileError } from '../../services/api.js';
import { formatDate, formatMoney } from '../../utils/formatters.js';

export default function EmployeeDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [today, setToday] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [payslips, setPayslips] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNotice(null);

    const [todayResult, leavesResult, payslipResult] = await Promise.allSettled([
      attendanceService.today(),
      leavesService.list(),
      payrollService.mine(),
    ]);

    if (todayResult.status === 'fulfilled') {
      setToday(todayResult.value.data);
    } else if (isNoProfileError(todayResult.reason)) {
      setToday(null);
      setNotice(getErrorMessage(todayResult.reason));
    } else {
      setError(getErrorMessage(todayResult.reason));
    }

    if (leavesResult.status === 'fulfilled') {
      setLeaves(leavesResult.value.data || []);
    } else if (!isNoProfileError(leavesResult.reason)) {
      setError(getErrorMessage(leavesResult.reason));
    }

    if (payslipResult.status === 'fulfilled') {
      setPayslips(payslipResult.value.data || []);
    } else if (isNoProfileError(payslipResult.reason)) {
      setPayslips([]);
    } else {
      setError(getErrorMessage(payslipResult.reason));
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const pendingCount = leaves.filter((leave) => leave.status === 'pending').length;
  const approvedCount = leaves.filter((leave) => leave.status === 'approved').length;
  const latestPayslip = payslips[0];

  return (
    <PageContainer
      title="My Dashboard"
      description="Your attendance, leaves and pay at a glance"
      loading={loading}
      error={error}
      onRetry={load}
      actions={
        <Link to="/attendance">
          <Button variant="secondary" size="sm">
            Attendance history
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      }
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-1">
          {notice ? (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-700">Attendance unavailable</p>
              <p className="mt-1 text-sm text-slate-500">{notice}</p>
            </div>
          ) : (
            <AttendanceClockCard data={today} onChanged={load} />
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
          <StatCard
            icon={Plane}
            label="Pending leave requests"
            value={pendingCount}
            tone="amber"
            hint="awaiting approval"
          />
          <StatCard icon={CalendarCheck} label="Approved leaves" value={approvedCount} tone="emerald" />
          <div className="sm:col-span-2 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-500">
                <Wallet className="h-4 w-4" />
                <span className="text-sm font-medium">Latest payslip</span>
              </div>
              <Link to="/payslips">
                <Button variant="ghost" size="sm">
                  All payslips
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            {latestPayslip ? (
              <>
                <p className="mt-3 text-2xl font-bold text-slate-900">
                  {formatMoney(latestPayslip.netPay)}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {latestPayslip.periodLabel} · gross {formatMoney(latestPayslip.grossPay)}
                </p>
              </>
            ) : (
              <p className="mt-3 text-sm text-slate-500">No payslips generated yet.</p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-900">Recent leave requests</h2>
        </div>
        <div className="p-5">
          {leaves.length === 0 ? (
            <p className="text-sm text-slate-500">
              You haven't requested any leave yet.{' '}
              <Link to="/leaves" className="font-medium text-blue-600">
                Request now
              </Link>
            </p>
          ) : (
            <Table>
              <Thead>
                <Tr>
                  <Th>Type</Th>
                  <Th>Dates</Th>
                  <Th>Status</Th>
                </Tr>
              </Thead>
              <Tbody>
                {leaves.slice(0, 5).map((leave) => (
                  <Tr key={leave._id}>
                    <Td className="capitalize">{leave.type}</Td>
                    <Td>
                      {formatDate(leave.startDate)} → {formatDate(leave.endDate)}
                    </Td>
                    <Td>
                      <Badge variant={statusVariant(leave.status)}>{leave.status}</Badge>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
