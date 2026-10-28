import { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import Input from './Input.jsx';

const PasswordInput = forwardRef(function PasswordInput(
  { label, error, name, id, className = '', ...props },
  ref
) {
  const [visible, setVisible] = useState(false);
  const inputId = id || name;

  return (
    <div className={className}>
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <div className="relative">
        <Input
          ref={ref}
          id={inputId}
          name={name}
          type={visible ? 'text' : 'password'}
          error={error}
          className="[&_input]:pr-10"
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          tabIndex={-1}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
});

export default PasswordInput;
