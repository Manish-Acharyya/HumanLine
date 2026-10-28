import { useState } from 'react';
import Input from '../ui/Input.jsx';
import PasswordInput from '../ui/PasswordInput.jsx';
import Select from '../ui/Select.jsx';
import Textarea from '../ui/Textarea.jsx';
import Button from '../ui/Button.jsx';
import ErrorAlert from '../ui/ErrorAlert.jsx';
import * as employeesService from '../../services/employees.js';
import { getErrorMessage } from '../../services/api.js';
import { DEPARTMENTS, EMPLOYMENT_TYPES } from '../../utils/constants.js';

const emptyForm = {
  name: '',
  email: '',
  password: '',
  phone: '',
  address: '',
  department: '',
  designation: '',
  employmentType: 'full-time',
  dateOfJoining: '',
  dateOfBirth: '',
  monthlySalary: '',
  allowanceTransport: '',
  allowanceHousing: '',
  allowanceMedical: '',
};

function toFormValues(employee) {
  if (!employee) return emptyForm;
  return {
    name: employee.user?.name || '',
    email: employee.user?.email || '',
    password: '',
    phone: employee.phone || '',
    address: employee.address || '',
    department: employee.department || '',
    designation: employee.designation || '',
    employmentType: employee.employmentType || 'full-time',
    dateOfJoining: employee.dateOfJoining ? employee.dateOfJoining.slice(0, 10) : '',
    dateOfBirth: employee.dateOfBirth ? employee.dateOfBirth.slice(0, 10) : '',
    monthlySalary: employee.monthlySalary ?? '',
    allowanceTransport: employee.allowances?.transport ?? '',
    allowanceHousing: employee.allowances?.housing ?? '',
    allowanceMedical: employee.allowances?.medical ?? '',
  };
}

export default function EmployeeForm({ employee = null, onSuccess, onError }) {
  const isEdit = Boolean(employee);
  const [form, setForm] = useState(() => toFormValues(employee));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const update = (field) => (event) =>
    setForm((prev) => ({ ...prev, [field]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        department: form.department.trim(),
        designation: form.designation.trim(),
        employmentType: form.employmentType,
        dateOfJoining: form.dateOfJoining,
        monthlySalary: Number(form.monthlySalary) || 0,
        allowances: {
          transport: Number(form.allowanceTransport) || 0,
          housing: Number(form.allowanceHousing) || 0,
          medical: Number(form.allowanceMedical) || 0,
        },
      };

      if (form.dateOfBirth) payload.dateOfBirth = form.dateOfBirth;
      if (!isEdit) payload.password = form.password;

      const response = isEdit
        ? await employeesService.update(employee._id, payload)
        : await employeesService.create(payload);
      onSuccess?.(response);
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      onError?.(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <ErrorAlert message={error} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Full name"
          name="name"
          value={form.name}
          onChange={update('name')}
          required
        />
        <Input
          label="Email address"
          type="email"
          name="email"
          value={form.email}
          onChange={update('email')}
          required
          disabled={isEdit}
        />
        {!isEdit && (
          <PasswordInput
            label="Temporary password"
            name="password"
            value={form.password}
            onChange={update('password')}
            placeholder="Min 6 characters"
            autoComplete="new-password"
            required
          />
        )}
        <Input
          label="Phone"
          name="phone"
          value={form.phone}
          onChange={update('phone')}
          placeholder="+91 98765 43210"
        />
        <Select
          label="Department"
          name="department"
          value={form.department}
          onChange={update('department')}
          required
        >
          <option value="">Select department</option>
          {DEPARTMENTS.map((dept) => (
            <option key={dept} value={dept}>
              {dept}
            </option>
          ))}
        </Select>
        <Input
          label="Designation"
          name="designation"
          value={form.designation}
          onChange={update('designation')}
          placeholder="Software Engineer"
          required
        />
        <Select
          label="Employment type"
          name="employmentType"
          value={form.employmentType}
          onChange={update('employmentType')}
        >
          {EMPLOYMENT_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </Select>
        <Input
          label="Date of joining"
          type="date"
          name="dateOfJoining"
          value={form.dateOfJoining}
          onChange={update('dateOfJoining')}
          required
        />
        <Input
          label="Date of birth"
          type="date"
          name="dateOfBirth"
          value={form.dateOfBirth}
          onChange={update('dateOfBirth')}
        />
        <Input
          label="Monthly salary (₹)"
          type="number"
          min="0"
          step="0.01"
          name="monthlySalary"
          value={form.monthlySalary}
          onChange={update('monthlySalary')}
          required
        />
      </div>

      <Textarea
        label="Address"
        name="address"
        rows={2}
        value={form.address}
        onChange={update('address')}
      />

      <fieldset className="rounded-lg border border-slate-200 p-4">
        <legend className="px-1 text-sm font-semibold text-slate-700">Allowances (monthly)</legend>
        <div className="grid gap-4 sm:grid-cols-3">
          <Input
            label="Transport"
            type="number"
            min="0"
            name="allowanceTransport"
            value={form.allowanceTransport}
            onChange={update('allowanceTransport')}
          />
          <Input
            label="Housing"
            type="number"
            min="0"
            name="allowanceHousing"
            value={form.allowanceHousing}
            onChange={update('allowanceHousing')}
          />
          <Input
            label="Medical"
            type="number"
            min="0"
            name="allowanceMedical"
            value={form.allowanceMedical}
            onChange={update('allowanceMedical')}
          />
        </div>
      </fieldset>

      <div className="flex justify-end gap-2">
        <Button type="submit" loading={loading}>
          {isEdit ? 'Save changes' : 'Register employee'}
        </Button>
      </div>
    </form>
  );
}
