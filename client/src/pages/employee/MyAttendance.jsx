import { useCallback, useEffect, useState } from 'react';
import { CalendarCheck } from 'lucide-react';
import PageContainer from '../../components/PageContainer.jsx';
import Badge, { statusVariant } from '../../components/ui/Badge.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import { Table, Thead, Tbody, Tr, Th, Td } from '../../components/ui/Table.jsx';
import AttendanceClockCard from '../../components/features/AttendanceClockCard.jsx';
import * as attendanceService from '../../services/attendance.js';
import { getErrorMessage, isNoProfileError } from '../../services/api.js';
import { formatDate, formatTime } from '../../utils/formatters.js';

export default function MyAttendance() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [today, setToday] = useState(null);
  const [records, setRecords] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNotice(null);

    const [todayResult, historyResult] = await Promise.allSettled([
      attendanceService.today(),
      attendanceService.history(),
    ]);

    if (todayResult.status === 'fulfilled') {
      setToday(todayResult.value.data);
    } else if (isNoProfileError(todayResult.reason)) {
      setToday(null);
      setNotice(getErrorMessage(todayResult.reason));
    } else {
      setError(getErrorMessage(todayResult.reason));
    }

    if (historyResult.status === 'fulfilled') {
      setRecords(historyResult.value.data || []);
    } else if (isNoProfileError(historyResult.reason)) {
      setRecords([]);
    } else {
      setError(getErrorMessage(historyResult.reason));
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <PageContainer
      title="My Attendance"
      description="Clock in/out and review your attendance history"
      loading={loading}
      error={error}
      onRetry={load}
    >
      {notice ? (
        <div className="max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-700">Attendance unavailable</p>
          <p className="mt-1 text-sm text-slate-500">{notice}</p>
        </div>
      ) : (
        <div className="max-w-md">
          <AttendanceClockCard data={today} onChanged={load} />
        </div>
      )}

      <div className="mt-6">
        <h2 className="mb-3 text-base font-semibold text-slate-900">History</h2>
        {records.length === 0 ? (
          <EmptyState
            icon={CalendarCheck}
            title="No attendance yet"
            description="Your clock-in/out records will appear here."
          />
        ) : (
          <Table>
            <Thead>
              <Tr>
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
      </div>
    </PageContainer>
  );
}
