import {useEffect, useId, useState, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes} from 'react';
import {AlertTriangle, CheckCircle2, CircleAlert, Info} from 'lucide-react';
import type {ResultStatus} from '../domain/types';
import {statusLabel} from '../utils/format';

type PanelProps = {
  title?: string;
  children: ReactNode;
  className?: string;
  actions?: ReactNode;
};

export function Panel({title, children, className = '', actions}: PanelProps) {
  return (
    <section className={`panel ${className}`}>
      {title ? (
        <div className="panel__header">
          <h2>{title}</h2>
          {actions}
        </div>
      ) : null}
      {children}
    </section>
  );
}

type NumberFieldProps = {
  label: string;
  value: number | undefined;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  required?: boolean;
  /** When false, undefined is treated as invalid (default true when min is defined, otherwise false). */
  allowEmpty?: boolean;
  onChange: (value: number | undefined) => void;
};

export function NumberField({label, value, unit, min, max, step = 1, required, allowEmpty, onChange}: NumberFieldProps) {
  const id = useId();
  const errorId = `${id}-err`;
  const [draft, setDraft] = useState<string>(value === undefined ? '' : String(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (focused) return;
    setDraft(value === undefined ? '' : String(value));
  }, [value, focused]);

  const emptyAllowed = allowEmpty ?? !required;
  const validate = (raw: string): string | undefined => {
    const trimmed = raw.trim();
    if (trimmed === '') return emptyAllowed ? undefined : 'Required';
    if (!/^-?\d+(\.\d+)?$/.test(trimmed)) return 'Not a number';
    const parsed = Number(trimmed);
    if (Number.isNaN(parsed)) return 'Not a number';
    if (min !== undefined && parsed < min) return `Min ${min}`;
    if (max !== undefined && parsed > max) return `Max ${max}`;
    return undefined;
  };
  const error = validate(draft);

  const commit = (raw: string) => {
    const trimmed = raw.trim();
    if (trimmed === '') {
      if (emptyAllowed) onChange(undefined);
      return;
    }
    if (validate(trimmed) !== undefined) return;
    onChange(Number(trimmed));
  };

  return (
    <label className="field">
      <span className="field__label">
        {label}
        {required ? <abbr className="field__required" title="Required">*</abbr> : null}
      </span>
      <span className={`field__control with-unit${error ? ' has-error' : ''}`}>
        <input
          type="text"
          inputMode="decimal"
          value={draft}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          onFocus={() => setFocused(true)}
          onChange={(event) => {
            const next = event.target.value;
            setDraft(next);
            if (validate(next) === undefined) commit(next);
          }}
          onBlur={(event) => {
            setFocused(false);
            commit(event.target.value);
          }}
          onKeyDown={(event) => {
            if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
              event.preventDefault();
              const current = Number(draft || '0') || 0;
              const next = event.key === 'ArrowUp' ? current + step : current - step;
              const clamped = Math.min(max ?? Infinity, Math.max(min ?? -Infinity, next));
              const formatted = String(Number(clamped.toFixed(6)));
              setDraft(formatted);
              onChange(clamped);
            }
          }}
        />
        {unit ? <span>{unit}</span> : null}
      </span>
      {error ? (
        <span id={errorId} className="field__error" role="alert">
          {error}
        </span>
      ) : null}
    </label>
  );
}

type TextFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>;

export function TextField({label, value, onChange, ...props}: TextFieldProps) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      <span className="field__control">
        <input {...props} value={value} onChange={(event) => onChange(event.target.value)} />
      </span>
    </label>
  );
}

type SelectFieldProps = {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  children: ReactNode;
} & Omit<SelectHTMLAttributes<HTMLSelectElement>, 'value' | 'onChange'>;

export function SelectField({label, value, onChange, children, ...props}: SelectFieldProps) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      <span className="field__control">
        <select {...props} value={value} onChange={(event) => onChange(event.target.value)}>
          {children}
        </select>
      </span>
    </label>
  );
}

type SegmentedButtonProps<T extends string> = {
  label: string;
  value: T;
  options: Array<{value: T; label: string}>;
  onChange: (value: T) => void;
};

export function SegmentedButton<T extends string>({label, value, options, onChange}: SegmentedButtonProps<T>) {
  return (
    <div className="segmented" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={option.value === value ? 'is-active' : ''}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function StatusBadge({status}: {status: ResultStatus}) {
  const Icon =
    status === 'pass' ? CheckCircle2 : status === 'fail' ? CircleAlert : status === 'warn' ? AlertTriangle : Info;
  return (
    <span className={`status-badge status-badge--${status}`}>
      <Icon size={15} aria-hidden="true" />
      {statusLabel(status)}
    </span>
  );
}

export function IconOnlyButton({
  label,
  children,
  className = '',
  ...props
}: {label: string; children: ReactNode; className?: string} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" className={`icon-button ${className}`} aria-label={label} title={label} {...props}>
      {children}
    </button>
  );
}
