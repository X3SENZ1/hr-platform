import type { CSSProperties } from 'react';
import type { Employee } from '../types';
import { getInitials } from '../lib/date';

export function Avatar({
  employee,
  size,
}: {
  employee?: Employee | null;
  size?: 'sm' | 'lg';
}) {
  const className = size ? `avatar avatar-${size}` : 'avatar';
  return (
    <span
      className={className}
      style={{
        background: employee?.avatarBg || '#E5E7EB',
        color: employee?.avatarColor || '#1F2937',
      }}
    >
      {getInitials(employee?.name || '')}
    </span>
  );
}

export function StatusText({ statusClass, label }: { statusClass: string; label: string }) {
  return (
    <span className={`status-text ${statusClass}`}>
      <span className="status-dot-sm" />
      {label}
    </span>
  );
}

export function ProgressBar({
  percent,
  height,
}: {
  percent: number;
  height?: number;
}) {
  const style: CSSProperties | undefined = height ? { height } : undefined;
  return (
    <div className="progress-track" style={style}>
      <div
        className={`progress-fill${percent === 100 ? ' done' : ''}`}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
