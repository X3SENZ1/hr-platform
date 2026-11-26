import { useState, type FormEvent } from 'react';
import { useHr } from '../../state/HrContext';
import { countCalendarDays, offsetISO, pluralize } from '../../lib/date';
import { LEAVE_TYPE_META } from '../../lib/meta';
import type { LeaveType } from '../../types';
import { IconClose } from '../icons';

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
  const [startDate, setStartDate] = useState(offsetISO(3));
  const [endDate, setEndDate] = useState(offsetISO(7));
  const [comment, setComment] = useState('');

  const days = countCalendarDays(startDate, endDate);
  const employee = getEmployee(employeeId);
  const balance = employee ? getVacationBalance(employee) : { remaining: 28 };
  const overlaps =
    days > 0 ? findDepartmentOverlaps(employeeId, startDate, endDate) : [];

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!employeeId || days <= 0) return;
    addLeave({
      employeeId,
      type,
      status,
      startDate,
      endDate,
      comment: comment.trim(),
    });
  };

  return (
    <div
      id="addLeaveModal"
      className="modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="addLeaveTitle"
    >
      <div className="modal-header">
        <h2 id="addLeaveTitle" className="modal-title">
          Заявка на отсутствие
        </h2>
        <button className="icon-btn" type="button" aria-label="Закрыть" onClick={closeModal}>
          <IconClose size={16} />
        </button>
      </div>
      <form className="modal-form" onSubmit={handleSubmit}>
        <div className="form-grid">
          <label className="form-field full">
            <span>Сотрудник *</span>
            <select
              name="employeeId"
              value={employeeId}
              onChange={(event) => setEmployeeId(event.target.value)}
              required
            >
              {data.employees.map((item) => (
                <option value={item.id} key={item.id}>
                  {item.name} ({item.role})
                </option>
              ))}
            </select>
          </label>
          <label className="form-field">
            <span>Тип *</span>
            <select
              name="type"
              value={type}
              onChange={(event) => setType(event.target.value as LeaveType)}
              required
            >
              {Object.entries(LEAVE_TYPE_META).map(([value, meta]) => (
                <option value={value} key={value}>
                  {meta.label}
                </option>
              ))}
            </select>
          </label>
          <label className="form-field">
            <span>Статус</span>
            <select
              name="status"
              value={status}
              onChange={(event) => setStatus(event.target.value as 'pending' | 'approved')}
            >
              <option value="pending">На согласование</option>
              <option value="approved">Одобрить сразу</option>
            </select>
          </label>
          <label className="form-field">
            <span>С *</span>
            <input
              type="date"
              name="startDate"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              required
            />
          </label>
          <label className="form-field">
            <span>По *</span>
            <input
              type="date"
              name="endDate"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              required
            />
          </label>
          <div
            id="leaveDaysPreview"
            className={`leave-preview full${startDate && endDate && days <= 0 ? ' error' : ''}`}
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
                  <span style={{ color: 'var(--warn)' }}>
                    Пересечение в отделе:{' '}
                    {overlaps
                      .map((leave) => getEmployee(leave.employeeId)?.name)
                      .filter(Boolean)
                      .join(', ')}
                  </span>
                ) : (
                  <span style={{ color: 'var(--text-muted)' }}>
                    Пересечений в отделе нет
                  </span>
                )}
              </>
            )}
          </div>
          <label className="form-field full">
            <span>Комментарий</span>
            <textarea
              name="comment"
              rows={2}
              placeholder="Кто подстрахует задачи на время отсутствия"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
            />
          </label>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={closeModal}>
            Отмена
          </button>
          <button type="submit" className="btn btn-primary">
            Создать заявку
          </button>
        </div>
      </form>
    </div>
  );
}
