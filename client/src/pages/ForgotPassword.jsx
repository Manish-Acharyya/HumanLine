import { useState } from 'react';
import { Link } from 'react-router-dom';
import { KeyRound, ArrowLeft, ArrowRight } from 'lucide-react';
import AuthLayout from '../components/AuthLayout.jsx';
import Input from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';
import ErrorAlert from '../components/ui/ErrorAlert.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import * as authService from '../services/auth.js';
import { getErrorMessage } from '../services/api.js';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [resetData, setResetData] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    setResetData(null);
    try {
      const response = await authService.forgotPassword(email);
      setSuccess(response.message);
      if (response.data?.resetToken) setResetData(response.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Forgot password" subtitle="We'll generate a reset token for your account">
      <ErrorAlert message={error} />

      {success && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      )}

      {resetData && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <p className="font-semibold">Development mode — reset token</p>
          <p className="mt-1 break-all font-mono text-xs">{resetData.resetToken}</p>
          <p className="mt-1 text-xs">
            Valid for {resetData.expiresInMinutes} minutes. In production this would be emailed.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email address"
          type="email"
          name="email"
          placeholder="you@company.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          required
        />

        <Button type="submit" loading={loading} className="w-full">
          <KeyRound className="h-4 w-4" />
          {loading ? 'Generating…' : 'Send reset token'}
        </Button>

        {resetData && (
          <Link
            to={`/reset-password?token=${encodeURIComponent(resetData.resetToken)}`}
            className="flex w-full items-center justify-center gap-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Continue to reset
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        <Link to="/login" className="inline-flex items-center gap-1 font-medium text-blue-600 hover:text-blue-700">
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
