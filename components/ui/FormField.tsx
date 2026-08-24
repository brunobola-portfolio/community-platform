import React, { useId } from 'react';
import { ChevronDown, LucideIcon } from 'lucide-react';

const LABEL_CLASS = 'block text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5';
const SHELL_CLASS = 'w-full rounded-2xl border bg-white dark:bg-slate-950/50 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 disabled:opacity-60 disabled:cursor-not-allowed';

interface FormInputProps {
  label: string;
  icon?: LucideIcon;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
}

export const FormInput: React.FC<FormInputProps> = ({
  label, icon: Icon, type = "text", value, onChange, placeholder, required, error, disabled
}) => {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className={LABEL_CLASS}>
        {label}
        {required && <span className="text-brand-600 dark:text-brand-400 ml-0.5">*</span>}
      </label>
      <div className="relative">
        {Icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            <Icon size={18} />
          </div>
        )}
        <input
          id={id}
          type={type}
          required={required}
          disabled={disabled}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`${SHELL_CLASS} h-12 px-4 ${Icon ? 'pl-11' : ''} ${error ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'}`}
        />
      </div>
      {error && <span className="text-red-600 dark:text-red-400 text-xs mt-1 block">{error}</span>}
    </div>
  );
};

interface FormTextareaProps {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  rows?: number;
  disabled?: boolean;
}

export const FormTextarea: React.FC<FormTextareaProps> = ({
  label, value, onChange, placeholder, required, error, rows = 5, disabled
}) => {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className={LABEL_CLASS}>
        {label}
        {required && <span className="text-brand-600 dark:text-brand-400 ml-0.5">*</span>}
      </label>
      <textarea
        id={id}
        className={`${SHELL_CLASS} min-h-[96px] py-3 px-4 resize-none ${error ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'}`}
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        rows={rows}
      />
      {error && <span className="text-red-600 dark:text-red-400 text-xs mt-1 block">{error}</span>}
    </div>
  );
};

interface FormSelectProps {
  label: string;
  icon?: LucideIcon;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string; label: string }[];
  error?: string;
  disabled?: boolean;
}

export const FormSelect: React.FC<FormSelectProps> = ({
  label, icon: Icon, value, onChange, options, error, disabled
}) => {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className={LABEL_CLASS}>
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            <Icon size={18} />
          </div>
        )}
        <select
          id={id}
          className={`${SHELL_CLASS} h-12 px-4 ${Icon ? 'pl-11' : ''} pr-10 appearance-none cursor-pointer ${error ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'}`}
          value={value}
          onChange={onChange}
          disabled={disabled}
        >
          {options.map(opt => (
            <option key={opt.value} value={opt.value} className="bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300">
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
      </div>
      {error && <span className="text-red-600 dark:text-red-400 text-xs mt-1 block">{error}</span>}
    </div>
  );
};
