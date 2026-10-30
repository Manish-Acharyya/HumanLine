import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import AuthLayout from '../components/AuthLayout.jsx';
import Input from '../components/ui/Input.jsx';
import PasswordInput from '../components/ui/PasswordInput.jsx';
import Button from '../components/ui/Button.jsx';
import ErrorAlert from '../components/ui/ErrorAlert.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import * as authService from '../services/auth.js';
import { getErrorMessage } from '../services/api.js';

export default function Login() {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notice] = useState(location.state?.flash || null);

  const update = (field) => (event) =>
    setForm((prev) => ({ ...prev, [field]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await authService.login(form);
     const user = response.data.data;

if (!user) {
  throw new Error("User data missing from login response");
}

setUser(user);

navigate(user.role === "admin" ? "/admin" : "/dashboard", {
  replace: true,
});
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your HumanLine account">
      {notice && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {notice}
        </div>
      )}
      <ErrorAlert message={error} />
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email address"
          type="email"
          name="email"
          placeholder="you@company.com"
          value={form.email}
          onChange={update('email')}
          autoComplete="email"
          required
        />

        <div>
          <PasswordInput
            label="Password"
            name="password"
            placeholder="••••••••"
            value={form.password}
            onChange={update('password')}
            autoComplete="current-password"
            required
          />
          <div className="mt-1 text-right">
            <Link
              to="/forgot-password"
              className="text-xs font-medium text-blue-600 hover:text-blue-700"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <Button type="submit" loading={loading} className="w-full">
          <LogIn className="h-4 w-4" />
          Sign in
        </Button>

        <p className="text-center text-sm text-slate-500">
          Don't have an account?{' '}
          <Link to="/register" className="font-medium text-blue-600 hover:text-blue-700">
            Register
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
