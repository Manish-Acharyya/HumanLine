import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import ProtectedRoute from './components/guards/ProtectedRoute.jsx';
import RoleRoute from './components/guards/RoleRoute.jsx';
import DashboardLayout from './components/layout/DashboardLayout.jsx';
import Spinner from './components/ui/Spinner.jsx';

import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Registration from './pages/Registration.jsx';
import NotFound from './pages/NotFound.jsx';

import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import Employees from './pages/admin/Employees.jsx';
import AttendanceRecords from './pages/admin/AttendanceRecords.jsx';
import LeaveRequests from './pages/admin/LeaveRequests.jsx';
import Payroll from './pages/admin/Payroll.jsx';

import EmployeeDashboard from './pages/employee/EmployeeDashboard.jsx';
import MyAttendance from './pages/employee/MyAttendance.jsx';
import MyLeaves from './pages/employee/MyLeaves.jsx';
import MyPayslips from './pages/employee/MyPayslips.jsx';
import Profile from './pages/employee/Profile.jsx';

function FullScreenSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center text-blue-600">
      <Spinner className="h-10 w-10" />
    </div>
  );
}

function homeFor(role) {
  return role === 'admin' ? '/admin' : '/dashboard';
}

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <FullScreenSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={homeFor(user.role)} replace />;
}

function PublicOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <FullScreenSpinner />;
  if (user) return <Navigate to={homeFor(user.role)} replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
          <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />

          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<EmployeeDashboard />} />
              <Route path="/attendance" element={<MyAttendance />} />
              <Route path="/leaves" element={<MyLeaves />} />
              <Route path="/payslips" element={<MyPayslips />} />
              <Route path="/profile" element={<Profile />} />

              <Route
                path="/admin"
                element={<RoleRoute roles={['admin']}><AdminDashboard /></RoleRoute>}
              />
              <Route
                path="/admin/employees"
                element={<RoleRoute roles={['admin']}><Employees /></RoleRoute>}
              />
              <Route
                path="/admin/register"
                element={<RoleRoute roles={['admin']}><Registration /></RoleRoute>}
              />
              <Route
                path="/admin/attendance"
                element={<RoleRoute roles={['admin']}><AttendanceRecords /></RoleRoute>}
              />
              <Route
                path="/admin/leaves"
                element={<RoleRoute roles={['admin']}><LeaveRequests /></RoleRoute>}
              />
              <Route
                path="/admin/payroll"
                element={<RoleRoute roles={['admin']}><Payroll /></RoleRoute>}
              />
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
