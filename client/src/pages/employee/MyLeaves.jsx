import { useCallback, useEffect, useState } from 'react';
import { CalendarDays, Plus } from 'lucide-react';
import PageContainer from '../../components/PageContainer.jsx';
import Button from '../../components/ui/Button.jsx';
import Badge, { statusVariant } from '../../components/ui/Badge.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import { Table, Thead, Tbody, Tr, Th, Td } from '../../components/ui/Table.jsx';
import LeaveRequestModal from '../../components/features/LeaveRequestModal.jsx';
import * as leavesService from '../../services/leaves.js';
import { getErrorMessage } from '../../services/api.js';
import { formatDate, formatDateTime } from '../../utils/formatters.js';

function daysBetween(start, end) {
  const ms = new Date(end).setHours(0, 0, 0, 0) - new Date(start).setHours(0, 0, 0, 0);
  return Math.floor(ms / 86400000) + 1;
}

export default function MyLeaves() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [flash, setFlash] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await leavesService.list();
      setLeaves(response.data || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!flash) return undefined;
    const timer = setTimeout(() => setFlash(null), 4000);
    return () => clearTimeout(timer);
  }, [flash]);

  const handleSuccess = () => {
    setFlash('Leave request submitted for approval');
    load();
  };

  return (
    <PageContainer
      title="My Leaves"
      description="Request time off and track approval status"
      loading={loading}
      error={error}
      onRetry={load}
      actions={
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4" />
          Request leave
        </Button>
      }
    >
      {flash && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {flash}
        </div>
      )}

      {leaves.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No leave requests"
          description="You haven't applied for any leave yet."
          action={
            <Button size="sm" onClick={() => setModalOpen(true)}>
              <Plus className="h-4 w-4" />
              Request leave
            </Button>
          }
        />
      ) : (
        <Table>
          <Thead>
            <Tr>
              <Th>Type</Th>
              <Th>Dates</Th>
              <Th>Days</Th>
              <Th>Reason</Th>
              <Th>Requested</Th>
              <Th>Status</Th>
              <Th>Review comment</Th>
            </Tr>
          </Thead>
          <Tbody>
            {leaves.map((leave) => (
              <Tr key={leave._id}>
                <Td className="capitalize">{leave.type}</Td>
                <Td>
                  {formatDate(leave.startDate)} → {formatDate(leave.endDate)}
                </Td>
                <Td>{daysBetween(leave.startDate, leave.endDate)}</Td>
                <Td className="max-w-52">
                  <p className="line-clamp-2 text-xs text-slate-500">{leave.reason}</p>
                </Td>
                <Td>{formatDateTime(leave.createdAt)}</Td>
                <Td>
                  <Badge variant={statusVariant(leave.status)}>{leave.status}</Badge>
                </Td>
                <Td className="text-xs text-slate-500">{leave.reviewComment || '—'}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}

      <LeaveRequestModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleSuccess}
      />
    </PageContainer>
  );
}
