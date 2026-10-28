const styles = {
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  warning: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  danger: 'bg-red-50 text-red-700 ring-red-600/20',
  info: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  neutral: 'bg-slate-100 text-slate-600 ring-slate-500/20',
};

export default function Badge({ variant = 'neutral', children, className = '' }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${styles[variant] || styles.neutral} ${className}`}
    >
      {children}
    </span>
  );
}

export function statusVariant(status) {
  const map = {
    present: 'success',
    approved: 'success',
    paid: 'success',
    active: 'success',
    late: 'warning',
    pending: 'warning',
    draft: 'warning',
    'on-leave': 'info',
    rejected: 'danger',
    terminated: 'danger',
    absent: 'danger',
    'half-day': 'neutral',
  };
  return map[status] || 'neutral';
}
