import type { CSSProperties, ReactNode } from 'react';
import type { Employee } from '../types';
import { getInitials } from '../lib/date';
import { useCountUp } from '../lib/hooks';

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
        background: employee?.avatarBg || 'var(--avatar-fallback-bg)',
        color: employee?.avatarColor || 'var(--avatar-fallback-text)',
      }}
      aria-hidden="true"
    >
      {getInitials(employee?.name || '')}
    </span>
  );
}

export function StatusBadge({
  statusClass,
  label,
}: {
  statusClass: string;
  label: string;
}) {
  return (
    <span className={`status-badge ${statusClass}`}>
      <span className="status-dot-sm" aria-hidden="true" />
      {label}
    </span>
  );
}

export function PriorityBadge({
  className,
  icon,
  label,
}: {
  className: string;
  icon: string;
  label: string;
}) {
  return (
    <span className={`priority-badge ${className}`}>
      <span aria-hidden="true">{icon}</span>
      <span className="visually-hidden">Приоритет: </span>
      {label}
    </span>
  );
}

export function ProgressBar({
  percent,
  height,
  label,
}: {
  percent: number;
  height?: number;
  label?: string;
}) {
  const style: CSSProperties | undefined = height ? { height } : undefined;
  return (
    <span
      className="progress-track"
      style={style}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      aria-label={label ?? 'Прогресс'}
    >
      <span
        className={`progress-fill${percent === 100 ? ' done' : ''}`}
        style={{ width: `${percent}%` }}
      />
    </span>
  );
}

export function CountUp({ value, suffix = '' }: { value: number; suffix?: string }) {
  const current = useCountUp(value);
  return (
    <span className="tabular">
      {current}
      {suffix}
    </span>
  );
}

export function TagList({ tags, label = 'Теги' }: { tags?: string[]; label?: string }) {
  if (!tags || tags.length === 0) return null;
  return (
    <ul className="tag-list" aria-label={label}>
      {tags.map((tag) => (
        <li className="tag" key={tag}>
          {tag}
        </li>
      ))}
    </ul>
  );
}

export function EmptyState({
  title,
  text,
  icon,
  action,
}: {
  title: string;
  text?: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <span className="empty-state-icon" aria-hidden="true">
        {icon ?? (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <circle cx="11" cy="11" r="7" />
            <line x1="20" y1="20" x2="16" y2="16" />
            <line x1="8" y1="11" x2="14" y2="11" />
          </svg>
        )}
      </span>
      <p className="empty-state-title">{title}</p>
      {text ? <p className="empty-state-text">{text}</p> : null}
      {action ? <div className="empty-state-action">{action}</div> : null}
    </div>
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <span className={`skeleton ${className}`.trim()} aria-hidden="true" />;
}

export function DashboardSkeleton() {
  return (
    <div className="skeleton-page" aria-busy="true" aria-label="Загрузка данных">
      <span className="visually-hidden">Загружаем данные платформы…</span>
      <div className="skeleton-metrics">
        {Array.from({ length: 4 }, (_, index) => (
          <div className="skeleton-card" key={index}>
            <Skeleton className="skeleton-line skeleton-line-sm" />
            <Skeleton className="skeleton-line skeleton-line-lg" />
            <Skeleton className="skeleton-line" />
          </div>
        ))}
      </div>
      <div className="skeleton-grid">
        {Array.from({ length: 2 }, (_, index) => (
          <div className="skeleton-card skeleton-card-tall" key={index}>
            <Skeleton className="skeleton-line skeleton-line-sm" />
            {Array.from({ length: 4 }, (_, row) => (
              <div className="skeleton-row" key={row}>
                <Skeleton className="skeleton-avatar" />
                <Skeleton className="skeleton-line" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
