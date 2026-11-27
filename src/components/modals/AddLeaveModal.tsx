import { useMemo, useState, type FormEvent } from 'react';
import { useHr } from '../../state/HrContext';
import { countCalendarDays, offsetISO, pluralize } from '../../lib/date';
import { LEAVE_PRIORITY_META, LEAVE_TYPE_META } from '../../lib/meta';
import type { LeavePriority, LeaveType } from '../../types';
import { IconClose } from '../icons';
import { ModalShell } from './ModalShell';

export function AddLeaveModal() {
  const {
    data,
    ui,
    addLeave,
    closeModal,
    getEmployee,
    getVacationBalance,
    findDepartmentOverlaps,
  } = useHr();

  const firstEmployeeId = data.employees[0]?.id ?? '';
  const [employeeId, setEmployeeId] = useState(ui.leavePrefillEmployeeId || firstEmployeeId);
  const [type, setType] = useState<LeaveType>('vacation');
  const [status, setStatus] = useState<'pending' | 'approved'>('pending');
  const [priority, setPriority] = useState<LeavePriority>('normal');
  const [startDate, setStartDate] = useState(offsetISO(3));
  const [endDate, setEndDate] = useState(offsetISO(7));
  const [comment, setComment] = useState('');
  const [touched, setTouched] = useState({ start: false, end: false, comment: false });

  const days = countCalendarDays(startDate, endDate);
  const employee = getEmployee(employeeId);
  const balance = employee ? getVacationBalance(employee) : { remaining: 28 };
  const overlaps = days > 0 ? findDepartmentOverlaps(employeeId, startDate, endDate) : [];

  const errors = useMemo(() => {
    const next: { start?: string; end?: string; comment?: string } = {};
    if (!startDate) next.start = 'Укажите дату начала.';
    if (!endDate) next.end = 'Укажите дату окончания.';
    else if (days <= 0) next.end = 'Дата окончания не может быть раньше даты начала.';
    if (comment.trim().length > 280) next.comment = 'Комментарий — не более 280 символов.';
    return next;
  }, [startDate, endDate, days, comment]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTouched({ start: true, end: true, comment: true });
    if (errors.start || errors.end || errors.comment || !employeeId) {
      const target = errors.start
        ? 'leave-startDate'
        : errors.end
          ? 'leave-endDate'
          : 'leave-comment';
      document.getElementById(target)?.focus();
      return;
    }
    addLeave({
      employeeId,
      type,
      status,
      startDate,
      endDate,
      comment: comment.trim(),
      priority,
    });
  };

  return (
    <ModalShell id="addLeaveModal" labelledBy="addLeaveTitle">
      <header className="modal-header">
        <div>
          <p className="modal-eyebrow">Отпуска</p>
          <h2 id="addLeaveTitle" className="modal-title">
            Заявка на отсутствие
          </h2>
        </div>
        <button className="icon-btn" type="button" aria-label="Закрыть окно" onClick={closeModal}>
          <IconClose size={16} />
        </button>
      </header>
      <form className="modal-form" onSubmit={handleSubmit} noValidate>
        <div className="modal-body">
          <div className="form-grid">
            <div className="form-field full">
              <label htmlFor="leave-employeeId">Сотрудник *</label>
              <select
                id="leave-employeeId"
                name="employeeId"
                value={employeeId}
                required
                onChange={(event) => setEmployeeId(event.target.value)}
              >
                {data.employees.map((item) => (
                  <option value={item.id} key={item.id}>
                    {item.name} ({item.role})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="leave-type">Тип *</label>
              <select
                id="leave-type"
                name="type"
                value={type}
                onChange={(event) => setType(event.target.value as LeaveType)}
              >
                {Object.entries(LEAVE_TYPE_META).map(([value, meta]) => (
                  <option value={value} key={value}>
                    {meta.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="leave-priority">Приоритет</label>
              <select
                id="leave-priority"
                name="priority"
                value={priority}
                onChange={(event) => setPriority(event.target.value as LeavePriority)}
              >
                {Object.entries(LEAVE_PRIORITY_META).map(([value, meta]) => (
                  <option value={value} key={value}>
                    {meta.icon} {meta.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="leave-startDate">Дата начала *</label>
              <input
                id="leave-startDate"
                type="date"
                value={startDate}
                required
                aria-invalid={Boolean(touched.start && errors.start)}
                aria-describedby={touched.start && errors.start ? 'leave-start-error' : undefined}
                onChange={(event) => setStartDate(event.target.value)}
                onBlur={() => setTouched((prev) => ({ ...prev, start: true }))}
              />
              {touched.start && errors.start ? (
                <p className="field-error" id="leave-start-error" role="alert">
                  {errors.start}
                </p>
              ) : null}
            </div>

            <div className="form-field">
              <label htmlFor="leave-endDate">Дата окончания *</label>
              <input
                id="leave-endDate"
                type="date"
                value={endDate}
                required
                aria-invalid={Boolean(touched.end && errors.end)}
                aria-describedby={touched.end && errors.end ? 'leave-end-error' : undefined}
                onChange={(event) => setEndDate(event.target.value)}
                onBlur={() => setTouched((prev) => ({ ...prev, end: true }))}
              />
              {touched.end && errors.end ? (
                <p className="field-error" id="leave-end-error" role="alert">
                  {errors.end}
                </p>
              ) : null}
            </div>

            <div className="form-field">
              <label htmlFor="leave-status">Статус</label>
              <select
                id="leave-status"
                name="status"
                value={status}
                onChange={(event) => setStatus(event.target.value as 'pending' | 'approved')}
              >
                <option value="pending">На согласование</option>
                <option value="approved">Одобрить сразу</option>
              </select>
            </div>

            <p
              id="leaveDaysPreview"
              className={`leave-preview full${days <= 0 ? ' error' : ''}`}
              aria-live="polite"
            >
              {!startDate || !endDate ? (
                'Выберите даты'
              ) : days <= 0 ? (
                'Дата окончания должна быть не раньше даты начала'
              ) : (
                <>
                  <span>
                    Длительность:{' '}
                    <strong>
                      {days} {pluralize(days, ['день', 'дня', 'дней'])}
                    </strong>{' '}
                    · Доступно: {balance.remaining} дн.
                  </span>
                  {overlaps.length > 0 ? (
                    <span className="inline-warning">
                      Пересечение в отделе:{' '}
                      {overlaps
                        .map((leave) => getEmployee(leave.employeeId)?.name)
                        .filter(Boolean)
                        .join(', ')}
                    </span>
                  ) : (
                    <span className="inline-ok">Пересечений в отделе нет</span>
                  )}
                </>
              )}
            </p>

            <div className="form-field full">
              <label htmlFor="leave-comment">Комментарий</label>
              <textarea
                id="leave-comment"
                name="comment"
                rows={3}
                maxLength={320}
                placeholder="Кто подстрахует задачи на время отсутствия"
                value={comment}
                aria-invalid={Boolean(touched.comment && errors.comment)}
                aria-describedby={touched.comment && errors.comment ? 'leave-comment-error' : undefined}
                onChange={(event) => setComment(event.target.value)}
                onBlur={() => setTouched((prev) => ({ ...prev, comment: true }))}
              />
              <div className="field-hint-row">
                <span className="field-hint">Необязательно</span>
                <span className="field-counter">{comment.length} / 280</span>
              </div>
              {touched.comment && errors.comment ? (
                <p className="field-error" id="leave-comment-error" role="alert">
                  {errors.comment}
                </p>
              ) : null}
            </div>
          </div>
        </div>
        <footer className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={closeModal}>
            Отмена
          </button>
          <button type="submit" className="btn btn-primary">
            Создать заявку
          </button>
        </footer>
      </form>
    </ModalShell>
  );
}
