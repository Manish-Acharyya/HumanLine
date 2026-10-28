import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ShieldCheck, ArrowLeft, CheckCircle2 } from 'lucide-react';
import AuthLayout from '../components/AuthLayout.jsx';
import Input from '../components/ui/Input.jsx';
import PasswordInput from '../components/ui/PasswordInput.jsx';
import Button from '../components/ui/Button.jsx';
import ErrorAlert from '../components/ui/ErrorAlert.jsx';
import * as authService from '../services/auth.js';
import { getErrorMessage } from '../services/api.js';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    token: searchParams.get('token') || '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);

  const update = (field) => (event) =>
    setForm((prev) => ({ ...prev, [field]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await authService.resetPassword(form);
      setDone(true);
      setTimeout(() => navigate('/login', { replace: true }), 1800);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Reset password" subtitle="Choose a new password for your account">
      <ErrorAlert message={error} />

      {done ? (
        <div className="flex flex-col items-center py-6 text-center">
          <CheckCircle2 className="h-12 w-12 text-emerald-500" />
          <p className="mt-3 font-semibold text-slate-900">Password reset successful</p>
          <p className="mt-1 text-sm text-slate-500">Redirecting you to the login page…</p>
          <Link
            to="/login"
            className="mt-4 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Go to sign in now
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Reset token"
            name="token"
            value={form.token}
            onChange={update('token')}
            placeholder="Paste your reset token"
            required
          />
          <PasswordInput
            label="New password"
            name="password"
            value={form.password}
            onChange={update('password')}
            autoComplete="new-password"
            placeholder="Minimum 6 characters"
            required
          />
          <PasswordInput
            label="Confirm new password"
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={update('confirmPassword')}
            autoComplete="new-password"
            placeholder="Repeat the new password"
            required
          />
          <Button type="submit" loading={loading} className="w-full">
            <ShieldCheck className="h-4 w-4" />
            Reset password
          </Button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-slate-500">
        <Link to="/login" className="inline-flex items-center gap-1 font-medium text-blue-600 hover:text-blue-700">
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
