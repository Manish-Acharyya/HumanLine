import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  CalendarCheck,
  CalendarDays,
  Wallet,
  ClipboardList,
  UserCircle,
  BadgeCheck,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

const adminLinks = [
  { to: '/admin', label: 'Admin Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/employees', label: 'Employees', icon: Users },
  { to: '/admin/register', label: 'Register Staff', icon: UserPlus },
  { to: '/admin/attendance', label: 'Attendance', icon: CalendarCheck },
  { to: '/admin/leaves', label: 'Leave Requests', icon: CalendarDays },
  { to: '/admin/payroll', label: 'Payroll', icon: Wallet },
];

const selfLinks = [
  { to: '/dashboard', label: 'My Dashboard', icon: ClipboardList, end: true },
  { to: '/attendance', label: 'My Attendance', icon: CalendarCheck },
  { to: '/leaves', label: 'My Leaves', icon: CalendarDays },
  { to: '/payslips', label: 'Payslips', icon: Wallet },
  { to: '/profile', label: 'Profile', icon: UserCircle },
];

function LinkItem({ to, label, icon: Icon, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={() => window.dispatchEvent(new CustomEvent('sidebar:close'))}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
          isActive
            ? 'bg-purple-100 text-purple-700 shadow-sm'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
        }`
      }
    >
      <Icon className="h-4.5 w-4.5" />
      {label}
    </NavLink>
  );
}

export default function Sidebar({ open, onClose }) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
              <BadgeCheck className="h-5 w-5" />
            </span>
            <span className="text-lg font-bold text-slate-900">HumanLine</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700 lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
          {isAdmin && (
            <div>
              <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Administration
              </p>
              <div className="space-y-1">
                {adminLinks.map((link) => (
                  <LinkItem key={link.to} {...link} />
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
              My Account
            </p>
            <div className="space-y-1">
              {selfLinks.map((link) => (
                <LinkItem key={link.to} {...link} />
              ))}
            </div>
          </div>
        </nav>

        <div className="border-t border-slate-200 px-5 py-4">
          <p className="truncate text-sm font-medium text-slate-900">{user?.name}</p>
          <p className="text-xs capitalize text-slate-500">{user?.role}</p>
        </div>
      </aside>
    </>
  );
}
