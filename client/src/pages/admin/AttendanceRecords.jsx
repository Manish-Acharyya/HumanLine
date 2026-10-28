import { useCallback, useEffect, useState } from 'react';
import { CalendarCheck, Search } from 'lucide-react';
import PageContainer from '../../components/PageContainer.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import Select from '../../components/ui/Select.jsx';
import Badge, { statusVariant } from '../../components/ui/Badge.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import { Table, Thead, Tbody, Tr, Th, Td } from '../../components/ui/Table.jsx';
import * as attendanceService from '../../services/attendance.js';
import * as employeesService from '../../services/employees.js';
import { getErrorMessage } from '../../services/api.js';
import {
  employeeName,
  formatDate,
  formatTime,
} from '../../utils/formatters.js';

export default function AttendanceRecords() {
  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [filters, setFilters] = useState({ employee: '', from: '', to: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params[key] = value;
      });
      const [recordsResponse, employeesResponse] = await Promise.all([
        attendanceService.history(params),
        employeesService.list({ limit: 100 }),
      ]);
      setRecords(recordsResponse.data || []);
      setEmployees(employeesResponse.data || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

  const updateFilter = (key) => (event) =>
    setFilters((prev) => ({ ...prev, [key]: event.target.value }));

  return (
    <PageContainer
      title="Attendance Records"
      description="Review clock-in/out activity across the company"
      loading={loading}
      error={error}
      onRetry={load}
    >
      <form
        className="mb-4 flex flex-wrap items-end gap-3"
        onSubmit={(event) => event.preventDefault()}
      >
        <Select
          className="w-56"
          label="Employee"
          name="employee"
          value={filters.employee}
          onChange={updateFilter('employee')}
        >
          <option value="">All employees</option>
          {employees.map((employee) => (
            <option key={employee._id} value={employee._id}>
              {employeeName(employee)} ({employee.employeeId})
            </option>
          ))}
        </Select>
        <Input
          className="w-44"
          label="From"
          type="date"
          name="from"
          value={filters.from}
          onChange={updateFilter('from')}
        />
        <Input
          className="w-44"
          label="To"
          type="date"
          name="to"
          value={filters.to}
          onChange={updateFilter('to')}
        />
        <Button type="button" variant="secondary" onClick={load}>
          <Search className="h-4 w-4" />
          Apply
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => setFilters({ employee: '', from: '', to: '' })}
        >
          Reset
        </Button>
      </form>

      {records.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title="No attendance records"
          description="No records match the selected filters."
        />
      ) : (
        <Table>
          <Thead>
            <Tr>
              <Th>Employee</Th>
              <Th>Date</Th>
              <Th>Clock in</Th>
              <Th>Clock out</Th>
              <Th>Hours</Th>
              <Th>Status</Th>
            </Tr>
          </Thead>
          <Tbody>
            {records.map((record) => (
              <Tr key={record._id}>
                <Td>
                  <p className="font-medium text-slate-900">{employeeName(record.employee)}</p>
                  <p className="text-xs text-slate-500">
                    {record.employee?.employeeId} · {record.employee?.designation}
                  </p>
                </Td>
                <Td>{formatDate(record.date)}</Td>
                <Td>{formatTime(record.clockIn)}</Td>
                <Td>{formatTime(record.clockOut)}</Td>
                <Td>{record.workedHours ? `${record.workedHours}h` : '—'}</Td>
                <Td>
                  <Badge variant={statusVariant(record.status)}>{record.status}</Badge>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}
    </PageContainer>
  );
}
