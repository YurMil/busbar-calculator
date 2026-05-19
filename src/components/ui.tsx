import type {InputHTMLAttributes, ReactNode, SelectHTMLAttributes} from 'react';
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
  onChange: (value: number | undefined) => void;
};

export function NumberField({label, value, unit, min, max, step = 1, onChange}: NumberFieldProps) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      <span className="field__control with-unit">
        <input
          type="number"
          value={value ?? ''}
          min={min}
          max={max}
          step={step}
          onChange={(event) => onChange(event.target.value === '' ? undefined : Number(event.target.value))}
        />
        {unit ? <span>{unit}</span> : null}
      </span>
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
