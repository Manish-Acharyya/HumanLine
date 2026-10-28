import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import AuthLayout from '../components/AuthLayout.jsx';
import Input from '../components/ui/Input.jsx';
import PasswordInput from '../components/ui/PasswordInput.jsx';
import Button from '../components/ui/Button.jsx';
import ErrorAlert from '../components/ui/ErrorAlert.jsx';
import * as authService from '../services/auth.js';
import { getErrorMessage } from '../services/api.js';

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const update = (field) => (event) =>
    setForm((prev) => ({ ...prev, [field]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await authService.register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      navigate('/login', {
        replace: true,
        state: { flash: 'Account registered successfully. You can now log in.' },
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Create your account" subtitle="Register to access your HumanLine account">
      <ErrorAlert message={error} />
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Full name"
          name="name"
          placeholder="John Doe"
          value={form.name}
          onChange={update('name')}
          autoComplete="name"
          required
        />

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

        <PasswordInput
          label="Password"
          name="password"
          placeholder="Min 6 characters"
          value={form.password}
          onChange={update('password')}
          autoComplete="new-password"
          minLength={6}
          required
        />

        <PasswordInput
          label="Confirm password"
          name="confirmPassword"
          placeholder="Re-enter password"
          value={form.confirmPassword}
          onChange={update('confirmPassword')}
          autoComplete="new-password"
          required
        />

        <Button type="submit" loading={loading} className="w-full">
          <UserPlus className="h-4 w-4" />
          Register
        </Button>

        <p className="text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-blue-600 hover:text-blue-700">
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
