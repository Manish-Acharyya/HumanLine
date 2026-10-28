import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import AuthLayout from '../components/AuthLayout.jsx';

export default function NotFound() {
  return (
    <AuthLayout title="404 — Page not found" subtitle="The page you're looking for doesn't exist">
      <div className="flex flex-col items-center py-4 text-center">
        <span className="rounded-full bg-slate-100 p-4 text-slate-400">
          <Compass className="h-8 w-8" />
        </span>
        <p className="mt-4 text-sm text-slate-500">
          Check the URL, or head back to your dashboard.
        </p>
        <Link
          to="/"
          className="mt-5 inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Go home
        </Link>
      </div>
    </AuthLayout>
  );
}
