import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, CalendarCheck, Plane, Inbox, ArrowRight } from 'lucide-react';
import PageContainer from '../../components/PageContainer.jsx';
import StatCard from '../../components/ui/StatCard.jsx';
import Badge, { statusVariant } from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import { Table, Thead, Tbody, Tr, Th, Td } from '../../components/ui/Table.jsx';
import * as attendanceService from '../../services/attendance.js';
import * as leavesService from '../../services/leaves.js';
import { getErrorMessage } from '../../services/api.js';
import { employeeName, formatDate } from '../../utils/formatters.js';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [pendingLeaves, setPendingLeaves] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryResponse, leavesResponse] = await Promise.all([
        attendanceService.summary(),
        leavesService.list({ status: 'pending' }),
      ]);
      setStats(summaryResponse.data);
      setPendingLeaves((leavesResponse.data || []).slice(0, 5));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <PageContainer
      title="Admin Dashboard"
      description="Company-wide overview for today"
      loading={loading}
      error={error}
      onRetry={load}
      actions={
        <Link to="/admin/employees">
          <Button variant="secondary" size="sm">
            Manage employees
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Users}
          label="Total employees"
          value={stats?.totalEmployees ?? '—'}
          tone="blue"
        />
        <StatCard
          icon={CalendarCheck}
          label="Present today"
          value={stats?.present ?? '—'}
          tone="emerald"
        />
        <StatCard icon={Plane} label="On leave" value={stats?.onLeave ?? '—'} tone="violet" />
        <StatCard icon={Inbox} label="Absent" value={stats?.absent ?? '—'} tone="amber" />
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Pending leave requests</h2>
            <p className="text-sm text-slate-500">Awaiting your approval</p>
          </div>
          <Link to="/admin/leaves">
            <Button variant="ghost" size="sm">
              View all
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="p-5">
          {pendingLeaves.length === 0 ? (
            <EmptyState
              icon={Plane}
              title="No pending requests"
              description="All caught up — there are no leave requests waiting for review."
            />
          ) : (
            <Table>
              <Thead>
                <Tr>
                  <Th>Employee</Th>
                  <Th>Type</Th>
                  <Th>Dates</Th>
                  <Th>Status</Th>
                </Tr>
              </Thead>
              <Tbody>
                {pendingLeaves.map((leave) => (
                  <Tr key={leave._id}>
                    <Td className="font-medium text-slate-900">
                      {employeeName(leave.employee)}
                    </Td>
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
