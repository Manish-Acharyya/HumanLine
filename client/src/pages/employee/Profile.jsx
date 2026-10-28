import { useCallback, useEffect, useState } from 'react';
import { UserCircle, Save } from 'lucide-react';
import PageContainer from '../../components/PageContainer.jsx';
import Input from '../../components/ui/Input.jsx';
import PasswordInput from '../../components/ui/PasswordInput.jsx';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
import ErrorAlert from '../../components/ui/ErrorAlert.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import * as authService from '../../services/auth.js';
import * as attendanceService from '../../services/attendance.js';
import { getErrorMessage, isNoProfileError } from '../../services/api.js';
import { formatDate } from '../../utils/formatters.js';

export default function Profile() {
  const { user, setUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [profileNotice, setProfileNotice] = useState(null);
  const [success, setSuccess] = useState(null);

  const [form, setForm] = useState({ name: '' });
  const [savingProfile, setSavingProfile] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    password: '',
    confirmPassword: '',
  });
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setProfileNotice(null);
    try {
      const response = await attendanceService.today();
      setEmployee(response.data?.employee || null);
      setForm({ name: response.data?.employee?.user?.name || user?.name || '' });
    } catch (err) {
      if (isNoProfileError(err)) {
        setEmployee(null);
        setProfileNotice(getErrorMessage(err));
        setForm({ name: user?.name || '' });
      } else {
        setError(getErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const update = (field) => (event) =>
    setForm((prev) => ({ ...prev, [field]: event.target.value }));

  const updatePassword = (field) => (event) =>
    setPasswordForm((prev) => ({ ...prev, [field]: event.target.value }));

  const saveProfile = async (event) => {
    event.preventDefault();
    setSavingProfile(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await authService.updateProfile({ name: form.name });
      setUser(response.data.user);
      setSuccess(response.message);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async (event) => {
    event.preventDefault();
    setSavingPassword(true);
    setPasswordError(null);
    setSuccess(null);
    if (passwordForm.password !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match');
      setSavingPassword(false);
      return;
    }
    try {
      const response = await authService.updateProfile({
        currentPassword: passwordForm.currentPassword,
        password: passwordForm.password,
      });
      setUser(response.data.user);
      setPasswordForm({ currentPassword: '', password: '', confirmPassword: '' });
      setSuccess('Password changed successfully');
    } catch (err) {
      setPasswordError(getErrorMessage(err));
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <PageContainer
      title="My Profile"
      description="Manage your personal information and password"
      loading={loading}
      error={error}
      onRetry={load}
    >
      {success && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <span className="rounded-lg bg-blue-50 p-2 text-blue-600">
              <UserCircle className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Account details</h2>
              <p className="text-sm text-slate-500">Signed in as {user?.email}</p>
            </div>
            <Badge variant={user?.role === 'admin' ? 'info' : 'neutral'} className="ml-auto">
              {user?.role}
            </Badge>
          </div>

          <form onSubmit={saveProfile} className="space-y-4">
            <Input
              label="Full name"
              name="name"
              value={form.name}
              onChange={update('name')}
              required
            />
            <Input label="Email address" value={user?.email || ''} disabled />
            <Button type="submit" loading={savingProfile}>
              <Save className="h-4 w-4" />
              Save profile
            </Button>
          </form>

          {employee && (
            <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-slate-100 pt-5 text-sm">
              <div>
                <dt className="text-xs text-slate-500">Employee ID</dt>
                <dd className="font-medium text-slate-900">{employee.employeeId}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Department</dt>
                <dd className="font-medium text-slate-900">{employee.department}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Designation</dt>
                <dd className="font-medium text-slate-900">{employee.designation}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Joined</dt>
                <dd className="font-medium text-slate-900">
                  {formatDate(employee.dateOfJoining)}
                </dd>
              </div>
            </dl>
          )}

          {profileNotice && (
            <p className="mt-6 border-t border-slate-100 pt-5 text-sm text-slate-500">
              {profileNotice}
            </p>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-1 text-base font-semibold text-slate-900">Change password</h2>
          <p className="mb-5 text-sm text-slate-500">
            Use at least 6 characters. You'll stay signed in after changing it.
          </p>

          <ErrorAlert message={passwordError} />

          <form onSubmit={savePassword} className="space-y-4">
            <PasswordInput
              label="Current password"
              name="currentPassword"
              value={passwordForm.currentPassword}
              onChange={updatePassword('currentPassword')}
              autoComplete="current-password"
              required
            />
            <PasswordInput
              label="New password"
              name="password"
              value={passwordForm.password}
              onChange={updatePassword('password')}
              autoComplete="new-password"
              required
            />
            <PasswordInput
              label="Confirm new password"
              name="confirmPassword"
              value={passwordForm.confirmPassword}
              onChange={updatePassword('confirmPassword')}
              autoComplete="new-password"
              required
            />
            <Button type="submit" loading={savingPassword}>
              <Save className="h-4 w-4" />
              Update password
            </Button>
          </form>
        </section>
      </div>
    </PageContainer>
  );
}
