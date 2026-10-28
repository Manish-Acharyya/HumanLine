import { useState } from 'react';
import { LogIn, LogOut, Clock } from 'lucide-react';
import Button from '../ui/Button.jsx';
import ErrorAlert from '../ui/ErrorAlert.jsx';
import Badge, { statusVariant } from '../ui/Badge.jsx';
import * as attendanceService from '../../services/attendance.js';
import { getErrorMessage } from '../../services/api.js';
import { formatTime } from '../../utils/formatters.js';

export default function AttendanceClockCard({ data, onChanged }) {
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const record = data?.record;

  const act = async (action) => {
    setLoading(action);
    setError(null);
    setMessage(null);
    try {
      const response =
        action === 'in' ? await attendanceService.clockIn() : await attendanceService.clockOut();
      setMessage(response.message);
      onChanged?.();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-500">
          <Clock className="h-4 w-4" />
          <span className="text-sm font-medium">Today's attendance</span>
        </div>
        {record?.status && <Badge variant={statusVariant(record.status)}>{record.status}</Badge>}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div className="rounded-lg bg-slate-50 px-3 py-2">
          <p className="text-xs text-slate-500">Clock in</p>
          <p className="font-semibold text-slate-900">{formatTime(record?.clockIn)}</p>
        </div>
        <div className="rounded-lg bg-slate-50 px-3 py-2">
          <p className="text-xs text-slate-500">Clock out</p>
          <p className="font-semibold text-slate-900">{formatTime(record?.clockOut)}</p>
        </div>
      </div>

      {message && (
        <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p>
      )}
      <div className="mt-3">
        <ErrorAlert message={error} />
      </div>

      <div className="mt-1 flex gap-2">
        <Button
          className="flex-1"
          onClick={() => act('in')}
          disabled={!data?.canClockIn}
          loading={loading === 'in'}
        >
          <LogIn className="h-4 w-4" />
          Clock in
        </Button>
        <Button
          className="flex-1"
          variant="secondary"
          onClick={() => act('out')}
          disabled={!data?.canClockOut}
          loading={loading === 'out'}
        >
          <LogOut className="h-4 w-4" />
          Clock out
        </Button>
      </div>
    </div>
  );
}
