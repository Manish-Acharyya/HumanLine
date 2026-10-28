import { useCallback, useEffect, useState } from 'react';
import { CalendarDays, Check, X } from 'lucide-react';
import PageContainer from '../../components/PageContainer.jsx';
import Button from '../../components/ui/Button.jsx';
import Badge, { statusVariant } from '../../components/ui/Badge.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Textarea from '../../components/ui/Textarea.jsx';
import ErrorAlert from '../../components/ui/ErrorAlert.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import { Table, Thead, Tbody, Tr, Th, Td } from '../../components/ui/Table.jsx';
import * as leavesService from '../../services/leaves.js';
import { getErrorMessage } from '../../services/api.js';
import { employeeName, formatDate } from '../../utils/formatters.js';

const STATUS_OPTIONS = ['', 'pending', 'approved', 'rejected'];

function daysBetween(start, end) {
  const ms = new Date(end).setHours(0, 0, 0, 0) - new Date(start).setHours(0, 0, 0, 0);
  return Math.floor(ms / 86400000) + 1;
}

export default function LeaveRequests() {
  const [leaves, setLeaves] = useState([]);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [rejectTarget, setRejectTarget] = useState(null);
  const [comment, setComment] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = statusFilter ? { status: statusFilter } : {};
      const response = await leavesService.list(params);
      setLeaves(response.data || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const approve = async (leave) => {
    setActionLoading(true);
    setActionError(null);
    try {
      await leavesService.approve(leave._id, 'Approved via dashboard');
      load();
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const openReject = (leave) => {
    setRejectTarget(leave);
    setComment('');
    setActionError(null);
  };

  const confirmReject = async () => {
    if (!rejectTarget) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await leavesService.reject(rejectTarget._id, comment);
      setRejectTarget(null);
      load();
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <PageContainer
      title="Leave Requests"
      description="Review and decide on employee leave applications"
      loading={loading}
      error={error}
      onRetry={load}
    >
      <div className="mb-4 inline-flex rounded-lg border border-slate-200 bg-white p-1">
        {STATUS_OPTIONS.map((status) => (
          <button
            key={status || 'all'}
            type="button"
            onClick={() => setStatusFilter(status)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium capitalize transition ${
              statusFilter === status
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {status || 'all'}
          </button>
        ))}
      </div>

      {actionError && (
        <div className="mb-4">
          <ErrorAlert message={actionError} />
        </div>
      )}

      {leaves.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No leave requests"
          description={`No ${statusFilter || ''} leave requests found.`}
        />
      ) : (
        <Table>
          <Thead>
            <Tr>
              <Th>Employee</Th>
              <Th>Type</Th>
              <Th>Dates</Th>
              <Th>Days</Th>
              <Th>Reason</Th>
              <Th>Status</Th>
              <Th className="text-right">Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {leaves.map((leave) => (
              <Tr key={leave._id}>
                <Td>
                  <p className="font-medium text-slate-900">{employeeName(leave.employee)}</p>
                  <p className="text-xs text-slate-500">{leave.employee?.employeeId}</p>
                </Td>
                <Td className="capitalize">{leave.type}</Td>
                <Td>
                  {formatDate(leave.startDate)} → {formatDate(leave.endDate)}
                </Td>
                <Td>{daysBetween(leave.startDate, leave.endDate)}</Td>
                <Td className="max-w-56">
                  <p className="line-clamp-2 text-xs text-slate-500">{leave.reason}</p>
                </Td>
                <Td>
                  <Badge variant={statusVariant(leave.status)}>{leave.status}</Badge>
                </Td>
                <Td>
                  <div className="flex justify-end gap-2">
                    {leave.status === 'pending' ? (
                      <>
                        <Button
                          size="sm"
                          variant="success"
                          disabled={actionLoading}
                          onClick={() => approve(leave)}
                        >
                          <Check className="h-3.5 w-3.5" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          disabled={actionLoading}
                          onClick={() => openReject(leave)}
                        >
                          <X className="h-3.5 w-3.5" />
                          Reject
                        </Button>
                      </>
                    ) : (
                      <span className="text-xs text-slate-400">
                        {leave.reviewComment || 'Reviewed'}
                      </span>
                    )}
                  </div>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}

      <Modal
        open={Boolean(rejectTarget)}
        title="Reject leave request"
        onClose={() => setRejectTarget(null)}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setRejectTarget(null)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmReject} loading={actionLoading}>
              Reject request
            </Button>
          </>
        }
      >
        <ErrorAlert message={actionError} />
        <p className="mb-3 text-sm text-slate-600">
          Rejecting the request from{' '}
          <strong>{rejectTarget && employeeName(rejectTarget.employee)}</strong> (
          {rejectTarget && formatDate(rejectTarget.startDate)} →{' '}
          {rejectTarget && formatDate(rejectTarget.endDate)}).
        </p>
        <Textarea
          label="Comment (optional)"
          name="comment"
          rows={3}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder="Reason for rejection…"
        />
      </Modal>
    </PageContainer>
  );
}
