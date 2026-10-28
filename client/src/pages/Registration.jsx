import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import PageContainer from '../components/PageContainer.jsx';
import EmployeeForm from '../components/features/EmployeeForm.jsx';
import Button from '../components/ui/Button.jsx';

export default function Registration() {
  const navigate = useNavigate();
  const [loading] = useState(false);
  const [error, setError] = useState(null);

  const handleSuccess = (response) => {
    navigate('/admin/employees', { state: { flash: response.message } });
  };

  return (
    <PageContainer
      title="Register employee"
      description="Create a new employee account and HR profile in one step"
      loading={loading}
      error={error}
      onRetry={() => setError(null)}
      actions={
        <Button variant="secondary" onClick={() => navigate('/admin/employees')}>
          Back to employees
        </Button>
      }
    >
      <div className="max-w-3xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-2 text-sm text-slate-500">
          <UserPlus className="h-4 w-4" />
          <span>
            The employee will receive a login account (role: employee) — share the temporary
            password securely.
          </span>
        </div>
        <EmployeeForm onSuccess={handleSuccess} onError={setError} />
      </div>
    </PageContainer>
  );
}
