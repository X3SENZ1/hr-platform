import { useRef, type ReactNode } from 'react';
import { useBodyScrollLock, useFocusTrap } from '../../lib/hooks';

export function ModalShell({
  id,
  labelledBy,
  className = '',
  children,
}: {
  id: string;
  labelledBy: string;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(true, ref);
  useBodyScrollLock(true);

  return (
    <div
      id={id}
      ref={ref}
      className={`modal ${className}`.trim()}
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
      tabIndex={-1}
    >
      {children}
    </div>
  );
}
