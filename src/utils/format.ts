import type {ResultStatus} from '../domain/types';

export const nf = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 1,
  minimumFractionDigits: 0,
});

export function formatNumber(value: number | undefined, digits = 1): string {
  if (value === undefined || Number.isNaN(value)) return 'not evaluated';
  return value.toLocaleString('en-US', {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  });
}

export function formatCompact(value: number | undefined, digits = 1): string {
  if (value === undefined || Number.isNaN(value)) return 'not evaluated';
  if (Math.abs(value) >= 1_000_000) return `${formatNumber(value / 1_000_000, digits)}M`;
  if (Math.abs(value) >= 1_000) return `${formatNumber(value / 1_000, digits)}k`;
  return formatNumber(value, digits);
}

export function statusLabel(status: ResultStatus): string {
  if (status === 'not-evaluated') return 'not eval';
  return status;
}

export function statusRank(status: ResultStatus): number {
  return status === 'pass' ? 0 : status === 'warn' ? 1 : status === 'not-evaluated' ? 2 : status === 'incomplete' ? 3 : 4;
}
