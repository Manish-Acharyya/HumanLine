import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Users, UserPlus, Pencil, Ban, Trash2, Search } from 'lucide-react';
import PageContainer from '../../components/PageContainer.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import Select from '../../components/ui/Select.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Badge, { statusVariant } from '../../components/ui/Badge.jsx';
import ErrorAlert from '../../components/ui/ErrorAlert.jsx';
import Textarea from '../../components/ui/Textarea.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import { Table, Thead, Tbody, Tr, Th, Td } from '../../components/ui/Table.jsx';
import EmployeeForm from '../../components/features/EmployeeForm.jsx';
import * as employeesService from '../../services/employees.js';
import { getErrorMessage } from '../../services/api.js';
import {
  employeeName,
  employeeEmail,
  formatMoney,
  formatDate,
  initials,
} from '../../utils/formatters.js';
import { DEPARTMENTS } from '../../utils/constants.js';

const initialFilters = { search: '', department: '', status: '' };

function Detail({ label, value, wide = false }) {
  return (
    <div className={wide ? 'sm:col-span-2' : ''}>
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-0.5 break-words text-sm text-slate-800">{value || '—'}</dd>
    </div>
  );
}

export default function Employees() {
  const location = useLocation();

  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState(initialFilters);
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [flash, setFlash] = useState(location.state?.flash || null);

  const [modal, setModal] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [terminateReason, setTerminateReason] = useState('');

  const [viewData, setViewData] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewError, setViewError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, limit: 10 };
      Object.entries({ ...filters, search: searchInput }).forEach(([key, value]) => {
        if (value) params[key] = value;
      });
      const response = await employeesService.list(params);
      setItems(response.data);
      setPagination(response.pagination);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page, filters, searchInput]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!flash) return undefined;
    const timer = setTimeout(() => setFlash(null), 4000);
    return () => clearTimeout(timer);
  }, [flash]);

  const applyFilters = (event) => {
    event.preventDefault();
    setPage(1);
    setFilters((prev) => ({ ...prev, search: searchInput }));
  };

  const closeModal = () => {
    setModal(null);
    setActionError(null);
    setTerminateReason('');
  };

  const handleFormSuccess = (response) => {
    setFlash(response.message);
    closeModal();
    load();
  };

  const handleView = async (employee) => {
    setModal({ type: 'view', employee });
    setViewData(null);
    setViewError(null);
    setViewLoading(true);
    try {
      const response = await employeesService.detail(employee._id);
      setViewData(response.data);
    } catch (err) {
      setViewError(getErrorMessage(err));
    } finally {
      setViewLoading(false);
    }
  };

  const openEdit = () => {
    const employee = viewData || modal?.employee;
    if (!employee) return;
    setModal({ type: 'edit', employee });
  };

  const viewProfile = modal?.type === 'view' ? viewData || modal.employee : null;

  const handleTerminate = async () => {
    if (!modal?.employee) return;
    setActionLoading(true);
    setActionError(null);
    try {
      const response = await employeesService.terminate(modal.employee._id, terminateReason);
      setFlash(response.message);
      closeModal();
      load();
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!modal?.employee) return;
    setActionLoading(true);
    setActionError(null);
    try {
      const response = await employeesService.remove(modal.employee._id);
      setFlash(response.message);
      closeModal();
      load();
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <PageContainer
      title="Employees"
      description={`${pagination.total} employee record${pagination.total === 1 ? '' : 's'} total`}
      loading={loading}
      error={error}
      onRetry={load}
      actions={
        <Button onClick={() => setModal({ type: 'add' })}>
          <UserPlus className="h-4 w-4" />
          Add employee
        </Button>
      }
    >
      {flash && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {flash}
        </div>
      )}

      <form onSubmit={applyFilters} className="mb-4 flex flex-wrap items-end gap-3">
        <div className="min-w-56 flex-1">
          <Input
            name="search"
            placeholder="Search name, email, ID, designation…"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />
        </div>
        <Select
          className="w-44"
          name="department"
          value={filters.department}
          onChange={(event) => {
            setPage(1);
            setFilters((prev) => ({ ...prev, department: event.target.value }));
          }}
        >
          <option value="">All departments</option>
          {DEPARTMENTS.map((dept) => (
            <option key={dept} value={dept}>
              {dept}
            </option>
          ))}
        </Select>
        <Select
          className="w-40"
          name="status"
          value={filters.status}
          onChange={(event) => {
            setPage(1);
            setFilters((prev) => ({ ...prev, status: event.target.value }));
          }}
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="terminated">Terminated</option>
        </Select>
        <Button type="submit" variant="secondary">
          <Search className="h-4 w-4" />
          Search
        </Button>
      </form>

      {items.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No employees found"
          description="Try adjusting the filters, or register a new employee."
          action={
            <Button size="sm" onClick={() => setModal({ type: 'add' })}>
              <UserPlus className="h-4 w-4" />
              Add employee
            </Button>
          }
        />
      ) : (
        <Table>
          <Thead>
            <Tr>
              <Th>Employee</Th>
              <Th>ID</Th>
              <Th>Department</Th>
              <Th>Designation</Th>
              <Th>Salary</Th>
              <Th>Status</Th>
              <Th className="text-right">Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {items.map((employee) => (
              <Tr
                key={employee._id}
                className="group cursor-pointer"
                tabIndex={0}
                onClick={() => handleView(employee)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') handleView(employee);
                }}
              >
                <Td>
                  <p className="font-medium text-slate-900 group-hover:text-purple-700">
                    {employeeName(employee)}
                  </p>
                  <p className="text-xs text-slate-500">{employeeEmail(employee)}</p>
                </Td>
                <Td className="font-mono text-xs">{employee.employeeId}</Td>
                <Td>{employee.department}</Td>
                <Td>{employee.designation}</Td>
                <Td>{formatMoney(employee.monthlySalary)}</Td>
                <Td>
                  <Badge variant={statusVariant(employee.employmentStatus)}>
                    {employee.employmentStatus}
                  </Badge>
                </Td>
                <Td>
                  <div className="flex justify-end gap-1.5">
                    <button
                      type="button"
                      title="Edit"
                      onClick={(event) => {
                        event.stopPropagation();
                        setModal({ type: 'edit', employee });
                      }}
                      className="rounded-full bg-sky-100 p-1.5 text-sky-600 transition hover:bg-sky-200 hover:text-sky-700"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    {employee.employmentStatus === 'active' && (
                      <button
                        type="button"
                        title="Terminate"
                        onClick={(event) => {
                          event.stopPropagation();
                          setModal({ type: 'terminate', employee });
                        }}
                        className="rounded-full bg-red-500 p-1.5 text-white transition hover:bg-red-600"
                      >
                        <Ban className="h-4 w-4" />
                      </button>
                    )}
                    {employee.employmentStatus === 'terminated' && (
                      <button
                        type="button"
                        title="Delete permanently"
                        onClick={(event) => {
                          event.stopPropagation();
                          setModal({ type: 'delete', employee });
                        }}
                        className="rounded-full bg-red-500 p-1.5 text-white transition hover:bg-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}

      {pagination.pages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
          <span>
            Page {pagination.page} of {pagination.pages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= pagination.pages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <Modal
        open={modal?.type === 'view'}
        title="Employee profile"
        onClose={closeModal}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={closeModal}>
              Close
            </Button>
            <Button onClick={openEdit}>
              <Pencil className="h-4 w-4" />
              Edit details
            </Button>
          </>
        }
      >
        {viewError && (
          <ErrorAlert
            message={viewError}
            onRetry={() => modal?.employee && handleView(modal.employee)}
          />
        )}
        {viewProfile && (
          <div>
            <div className="flex items-center gap-4 border-b border-slate-200 pb-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-purple-100 text-lg font-semibold text-purple-700">
                {initials(employeeName(viewProfile))}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="truncate text-lg font-semibold text-slate-900">
                    {employeeName(viewProfile)}
                  </h4>
                  <Badge variant={statusVariant(viewProfile.employmentStatus)}>
                    {viewProfile.employmentStatus}
                  </Badge>
                  <Badge variant={viewProfile.user?.status === 'inactive' ? 'danger' : 'success'}>
                    account {viewProfile.user?.status || 'active'}
                  </Badge>
                </div>
                <p className="truncate text-sm text-slate-500">{employeeEmail(viewProfile)}</p>
              </div>
              {viewLoading && <Spinner className="h-4 w-4 shrink-0 text-purple-500" />}
            </div>

            <dl className="mt-4 grid gap-x-6 gap-y-4 sm:grid-cols-2">
              <Detail
                label="Employee ID"
                value={<span className="font-mono">{viewProfile.employeeId}</span>}
              />
              <Detail label="Department" value={viewProfile.department} />
              <Detail label="Designation" value={viewProfile.designation} />
              <Detail label="Employment type" value={viewProfile.employmentType} />
              <Detail label="Phone" value={viewProfile.phone} />
              <Detail label="Date of joining" value={formatDate(viewProfile.dateOfJoining)} />
              <Detail label="Date of birth" value={formatDate(viewProfile.dateOfBirth)} />
              <Detail label="Monthly salary" value={formatMoney(viewProfile.monthlySalary)} />
              <Detail label="Address" value={viewProfile.address} wide />
              <Detail
                label="Monthly allowances"
                value={[
                  viewProfile.allowances?.transport
                    ? `Transport ${formatMoney(viewProfile.allowances.transport)}`
                    : null,
                  viewProfile.allowances?.housing
                    ? `Housing ${formatMoney(viewProfile.allowances.housing)}`
                    : null,
                  viewProfile.allowances?.medical
                    ? `Medical ${formatMoney(viewProfile.allowances.medical)}`
                    : null,
                ]
                  .filter(Boolean)
                  .join('  ·  ')}
                wide
              />
              {viewProfile.employmentStatus === 'terminated' &&
                viewProfile.termination?.date && (
                  <Detail
                    label="Termination"
                    value={`${formatDate(viewProfile.termination.date)}${
                      viewProfile.termination.reason ? ` — ${viewProfile.termination.reason}` : ''
                    }`}
                    wide
                  />
                )}
            </dl>
          </div>
        )}
      </Modal>

      <Modal
        open={modal?.type === 'add'}
        title="Add employee"
        onClose={closeModal}
        size="lg"
      >
        <EmployeeForm onSuccess={handleFormSuccess} onError={setActionError} />
      </Modal>

      <Modal
        open={modal?.type === 'edit'}
        title={`Edit ${modal?.employee ? employeeName(modal.employee) : ''}`}
        onClose={closeModal}
        size="lg"
      >
        {modal?.employee && (
          <EmployeeForm
            employee={modal.employee}
            onSuccess={handleFormSuccess}
            onError={setActionError}
          />
        )}
      </Modal>

      <Modal
        open={modal?.type === 'terminate'}
        title="Terminate employee"
        onClose={closeModal}
        footer={
          <>
            <Button variant="secondary" onClick={closeModal} disabled={actionLoading}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleTerminate} loading={actionLoading}>
              <Ban className="h-4 w-4" />
              Terminate
            </Button>
          </>
        }
      >
        <ErrorAlert message={actionError} />
        <p className="mb-3 text-sm text-slate-600">
          Terminating <strong>{modal?.employee && employeeName(modal.employee)}</strong> will
          deactivate their login account. Their records are preserved.
        </p>
        <Textarea
          label="Reason (optional)"
          name="reason"
          rows={3}
          value={terminateReason}
          onChange={(event) => setTerminateReason(event.target.value)}
          placeholder="Restructuring, resignation…"
        />
      </Modal>

      <Modal
        open={modal?.type === 'delete'}
        title="Delete employee permanently"
        onClose={closeModal}
        footer={
          <>
            <Button variant="secondary" onClick={closeModal} disabled={actionLoading}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} loading={actionLoading}>
              <Trash2 className="h-4 w-4" />
              Delete forever
            </Button>
          </>
        }
      >
        <ErrorAlert message={actionError} />
        <p className="text-sm text-slate-600">
          This permanently removes the account, profile, and all attendance, leave and payroll
          records for <strong>{modal?.employee && employeeName(modal.employee)}</strong>. This
          action cannot be undone.
        </p>
      </Modal>
    </PageContainer>
  );
}
