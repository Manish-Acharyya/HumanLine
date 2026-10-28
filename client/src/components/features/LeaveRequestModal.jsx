import { useState } from 'react';
import Modal from '../ui/Modal.jsx';
import Select from '../ui/Select.jsx';
import Input from '../ui/Input.jsx';
import Textarea from '../ui/Textarea.jsx';
import Button from '../ui/Button.jsx';
import ErrorAlert from '../ui/ErrorAlert.jsx';
import * as leavesService from '../../services/leaves.js';
import { getErrorMessage } from '../../services/api.js';
import { LEAVE_TYPES } from '../../utils/constants.js';

export default function LeaveRequestModal({ open, onClose, onSuccess }) {
  const [form, setForm] = useState({ type: 'annual', startDate: '', endDate: '', reason: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const update = (field) => (event) =>
    setForm((prev) => ({ ...prev, [field]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await leavesService.create(form);
      setForm({ type: 'annual', startDate: '', endDate: '', reason: '' });
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      title="Request leave"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" form="leave-request-form" loading={loading}>
            Submit request
          </Button>
        </>
      }
    >
      <form id="leave-request-form" onSubmit={handleSubmit} className="space-y-4">
        <ErrorAlert message={error} />
        <Select label="Leave type" name="type" value={form.type} onChange={update('type')} required>
          {LEAVE_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </Select>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Start date"
            type="date"
            name="startDate"
            value={form.startDate}
            onChange={update('startDate')}
            required
          />
          <Input
            label="End date"
            type="date"
            name="endDate"
            value={form.endDate}
            onChange={update('endDate')}
            required
          />
        </div>
        <Textarea
          label="Reason"
          name="reason"
          rows={3}
          value={form.reason}
          onChange={update('reason')}
          placeholder="Brief reason for leave…"
          required
        />
      </form>
    </Modal>
  );
}
