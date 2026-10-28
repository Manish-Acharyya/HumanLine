import Spinner from './ui/Spinner.jsx';
import ErrorAlert from './ui/ErrorAlert.jsx';

export default function PageContainer({
  title,
  description,
  loading = false,
  error = null,
  onRetry,
  actions,
  children,
}) {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {title && <h1 className="text-2xl font-bold text-slate-900">{title}</h1>}
          {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </header>

      <ErrorAlert message={error} onRetry={onRetry} />

      {loading ? (
        <div className="flex min-h-[240px] items-center justify-center text-blue-600">
          <Spinner className="h-8 w-8" />
        </div>
      ) : (
        children
      )}
    </div>
  );
}
