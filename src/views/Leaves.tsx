import { useSearchParams } from 'react-router-dom';
import { useHr } from '../state/HrContext';
import {
  countCalendarDays,
  formatDateRange,
  MONTHS_NOM_RU,
  pluralize,
  toISODate,
  TODAY_ISO,
} from '../lib/date';
import { LEAVE_PRIORITY_META, LEAVE_STATUS_META, LEAVE_TYPE_META } from '../lib/meta';
import type { LeaveStatus } from '../types';
import { Avatar, EmptyState, PriorityBadge, StatusBadge } from '../components/ui';
import { CustomSelect, RadioGroup } from '../components/Filters';
import { IconChevronLeft, IconChevronRight } from '../components/icons';

const LEAVES_PAGE_SIZE = 8;

export function Leaves() {
  const {
    data,
    ui,
    patchUi,
    getEmployee,
    getVacationBalance,
    findDepartmentOverlaps,
    decideLeave,
    deleteLeave,
    openDrawer,
  } = useHr();
  const [searchParams, setSearchParams] = useSearchParams();

  const pendingLeaves = data.leaves.filter((leave) => leave.status === 'pending');

  const { year, month } = ui.leaveMonth;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthStartIso = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const monthEndIso = `${year}-${String(month + 1).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

  const monthLeaves = data.leaves.filter(
    (leave) =>
      leave.status !== 'rejected' &&
      leave.startDate <= monthEndIso &&
      leave.endDate >= monthStartIso,
  );

  const departmentEmployees = data.employees.filter(
    (employee) => ui.leaveDeptFilter === 'all' || employee.departmentId === ui.leaveDeptFilter,
  );

  const timelineEmployees = ui.leaveShowAllTimeline
    ? departmentEmployees
    : departmentEmployees.filter((employee) =>
        monthLeaves.some((leave) => leave.employeeId === employee.id),
      );

  const days = Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1;
    const date = new Date(year, month, day, 12, 0, 0);
    const iso = toISODate(date);
    return {
      day,
      iso,
      isWeekend: date.getDay() === 0 || date.getDay() === 6,
      isToday: iso === TODAY_ISO,
    };
  });

  const filteredRequests = data.leaves
    .filter((leave) => ui.leaveStatusFilter === 'all' || leave.status === ui.leaveStatusFilter)
    .slice()
    .sort((a, b) => b.startDate.localeCompare(a.startDate));

  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / LEAVES_PAGE_SIZE));
  const rawPage = Number(searchParams.get('lpage') ?? '1');
  const page = Math.min(
    Math.max(1, Number.isFinite(rawPage) ? Math.trunc(rawPage) : 1),
    totalPages,
  );
  const pageItems = filteredRequests.slice(
    (page - 1) * LEAVES_PAGE_SIZE,
    page * LEAVES_PAGE_SIZE,
  );

  const setPage = (next: number) => {
    const safe = Math.min(Math.max(1, next), totalPages);
    const params = new URLSearchParams(searchParams);
    if (safe <= 1) params.delete('lpage');
    else params.set('lpage', String(safe));
    setSearchParams(params);
  };

  const resetPageParam = () => {
    if (!searchParams.has('lpage')) return;
    const params = new URLSearchParams(searchParams);
    params.delete('lpage');
    setSearchParams(params, { replace: true });
  };

  const shiftMonth = (delta: number) => {
    const next = new Date(year, month + delta, 1);
    patchUi({ leaveMonth: { year: next.getFullYear(), month: next.getMonth() } });
  };

  const setStatusFilter = (value: 'all' | LeaveStatus) => {
    patchUi({ leaveStatusFilter: value });
    resetPageParam();
  };

  return (
    <div className="stack">
      {pendingLeaves.length > 0 ? (
        <section className="card" aria-labelledby="pending-leaves-title">
          <header className="card-header">
            <div>
              <h2 className="card-title" id="pending-leaves-title">
                Ожидают согласования
              </h2>
              <p className="card-subtitle" aria-live="polite">
                {pendingLeaves.length} заявок
              </p>
            </div>
          </header>
          <ul className="list approval-list">
            {pendingLeaves.map((leave) => {
              const employee = getEmployee(leave.employeeId);
              if (!employee) return null;
              const typeMeta = LEAVE_TYPE_META[leave.type] ?? LEAVE_TYPE_META.vacation;
              const priorityMeta = LEAVE_PRIORITY_META[leave.priority ?? 'normal'];
              const daysCount = countCalendarDays(leave.startDate, leave.endDate);
              const balance = getVacationBalance(employee);
              const overlaps = findDepartmentOverlaps(
                leave.employeeId,
                leave.startDate,
                leave.endDate,
                leave.id,
              );
              return (
                <li key={leave.id}>
                  <article className="approval-card">
                    <header className="approval-header">
                      <span className="person-cell">
                        <Avatar employee={employee} />
                        <span className="person-meta">
                          <span className="person-name">{employee.name}</span>
                          <span className="person-sub">{employee.role}</span>
                        </span>
                      </span>
                      <PriorityBadge
                        className={priorityMeta.className}
                        icon={priorityMeta.icon}
                        label={priorityMeta.label}
                      />
                    </header>
                    <p className="approval-meta">
                      {typeMeta.short} ·{' '}
                      <time dateTime={leave.startDate}>
                        {formatDateRange(leave.startDate, leave.endDate)}
                      </time>{' '}
                      · {daysCount} {pluralize(daysCount, ['день', 'дня', 'дней'])} · остаток{' '}
                      {balance.remaining} дн.
                    </p>
                    {leave.comment ? <p className="approval-comment">{leave.comment}</p> : null}
                    {overlaps.length > 0 ? (
                      <p className="inline-warning">
                        Пересечение в отделе:{' '}
                        {overlaps
                          .map((item) => getEmployee(item.employeeId)?.name)
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                    ) : (
                      <p className="inline-ok">Пересечений в отделе нет</p>
                    )}
                    <footer className="approval-actions">
                      <button
                        className="btn btn-sm btn-primary"
                        type="button"
                        onClick={() => decideLeave(leave.id, 'approved')}
                      >
                        Одобрить
                      </button>
                      <button
                        className="btn btn-sm btn-secondary"
                        type="button"
                        onClick={() => decideLeave(leave.id, 'rejected')}
                      >
                        Отклонить
                      </button>
                      <button
                        className="btn btn-sm btn-ghost"
                        type="button"
                        onClick={() => openDrawer(employee.id)}
                      >
                        Профиль
                      </button>
                    </footer>
                  </article>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <section className="card" aria-labelledby="timeline-title">
        <header className="card-header card-header-wrap">
          <div className="timeline-controls">
            <button
              className="icon-btn"
              type="button"
              aria-label="Предыдущий месяц"
              onClick={() => shiftMonth(-1)}
            >
              <IconChevronLeft />
            </button>
            <h2 className="card-title timeline-title" id="timeline-title">
              {MONTHS_NOM_RU[month]} {year}
            </h2>
            <button
              className="icon-btn"
              type="button"
              aria-label="Следующий месяц"
              onClick={() => shiftMonth(1)}
            >
              <IconChevronRight />
            </button>
          </div>
          <div className="timeline-tools">
            <CustomSelect
              id="leaveDeptFilter"
              label="Отдел"
              value={ui.leaveDeptFilter}
              options={[
                { value: 'all', label: 'Все отделы' },
                ...data.departments.map((department) => ({
                  value: department.id,
                  label: department.name,
                })),
              ]}
              onChange={(value) => patchUi({ leaveDeptFilter: value })}
            />
            <ul className="timeline-legend" aria-label="Легенда графика">
              <li>
                <span className="legend-dot legend-vacation" aria-hidden="true" />
                Отпуск
              </li>
              <li>
                <span className="legend-dot legend-dayoff" aria-hidden="true" />
                Отгул
              </li>
              <li>
                <span className="legend-dot legend-sick" aria-hidden="true" />
                Больничный
              </li>
            </ul>
            <button
              className="btn btn-sm btn-secondary"
              type="button"
              onClick={() => patchUi({ leaveShowAllTimeline: !ui.leaveShowAllTimeline })}
            >
              {ui.leaveShowAllTimeline ? 'Только с отпусками' : 'Показать всех'}
            </button>
          </div>
        </header>
        <figure className="timeline-figure">
          <div className="table-wrap timeline-wrap">
            <table className="timeline-table">
              <caption>
                График отсутствий на {MONTHS_NOM_RU[month].toLowerCase()} {year}: сотрудники и дни
                месяца
              </caption>
              <thead>
                <tr>
                  <th scope="col">Сотрудник</th>
                  {days.map((day) => (
                    <th
                      scope="col"
                      className={`timeline-day-th${day.isWeekend ? ' weekend' : ''}${day.isToday ? ' today' : ''}`}
                      key={day.iso}
                    >
                      <time dateTime={day.iso}>{day.day}</time>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timelineEmployees.length === 0 ? (
                  <tr>
                    <td className="table-empty" colSpan={daysInMonth + 1}>
                      Отсутствий в этом месяце нет
                    </td>
                  </tr>
                ) : (
                  timelineEmployees.map((employee) => {
                    const employeeLeaves = monthLeaves.filter(
                      (leave) => leave.employeeId === employee.id,
                    );
                    return (
                      <tr key={employee.id}>
                        <th scope="row" className="timeline-person">
                          <button
                            className="person-cell person-button"
                            type="button"
                            onClick={() => openDrawer(employee.id)}
                          >
                            <Avatar employee={employee} size="sm" />
                            <span className="person-meta">
                              <span className="person-name">{employee.name}</span>
                            </span>
                          </button>
                        </th>
                        {days.map((day) => {
                          const match = employeeLeaves.find(
                            (leave) => leave.startDate <= day.iso && leave.endDate >= day.iso,
                          );
                          return (
                            <td
                              className={`timeline-cell${day.isWeekend ? ' weekend' : ''}${day.isToday ? ' today' : ''}`}
                              key={day.iso}
                            >
                              {match ? (
                                <span
                                  className={`timeline-bar ${match.type}${match.status === 'pending' ? ' pending' : ''}`}
                                  title={`${employee.name}: ${(LEAVE_TYPE_META[match.type] ?? LEAVE_TYPE_META.vacation).short} (${formatDateRange(match.startDate, match.endDate)}) — ${(LEAVE_STATUS_META[match.status] ?? LEAVE_STATUS_META.approved).label}`}
                                />
                              ) : null}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <figcaption>
            Цветные полосы показывают отсутствия; полупрозрачные — заявки на согласовании.
          </figcaption>
        </figure>
      </section>

      <section className="card" aria-labelledby="all-requests-title">
        <header className="card-header card-header-wrap">
          <div>
            <h2 className="card-title" id="all-requests-title">
              Все заявки
            </h2>
            <p className="card-subtitle">Найдено: {filteredRequests.length}</p>
          </div>
          <RadioGroup
            legend="Статус заявки"
            options={[
              { value: 'all', label: 'Все' },
              { value: 'pending', label: 'Ожидают' },
              { value: 'approved', label: 'Одобрены' },
              { value: 'rejected', label: 'Отклонены' },
            ]}
            value={ui.leaveStatusFilter}
            onChange={setStatusFilter}
          />
        </header>
        {filteredRequests.length === 0 ? (
          <EmptyState
            title="Заявок нет"
            text="Измените фильтр статуса или создайте новую заявку."
          />
        ) : (
          <>
            <div className="table-wrap">
              <table className="data-table leaves-table">
                <caption>
                  Заявки на отсутствие — страница {page} из {totalPages}
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Сотрудник</th>
                    <th scope="col">Тип</th>
                    <th scope="col">Период</th>
                    <th scope="col">Длительность</th>
                    <th scope="col">Статус</th>
                    <th scope="col">Приоритет</th>
                    <th scope="col">Комментарий</th>
                    <th scope="col">
                      <span className="visually-hidden">Действия</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((leave) => {
                    const employee = getEmployee(leave.employeeId);
                    if (!employee) return null;
                    const typeMeta = LEAVE_TYPE_META[leave.type] ?? LEAVE_TYPE_META.vacation;
                    const statusMeta =
                      LEAVE_STATUS_META[leave.status] ?? LEAVE_STATUS_META.pending;
                    const priorityMeta = LEAVE_PRIORITY_META[leave.priority ?? 'normal'];
                    const daysCount = countCalendarDays(leave.startDate, leave.endDate);
                    return (
                      <tr key={leave.id}>
                        <th scope="row" data-label="Сотрудник">
                          <button
                            className="person-cell person-button"
                            type="button"
                            onClick={() => openDrawer(employee.id)}
                          >
                            <Avatar employee={employee} size="sm" />
                            <span className="person-meta">
                              <span className="person-name">{employee.name}</span>
                            </span>
                          </button>
                        </th>
                        <td data-label="Тип">{typeMeta.label}</td>
                        <td data-label="Период" className="tabular">
                          <time dateTime={leave.startDate}>
                            {formatDateRange(leave.startDate, leave.endDate)}
                          </time>
                        </td>
                        <td data-label="Длительность" className="tabular">
                          {daysCount} дн.
                        </td>
                        <td data-label="Статус">
                          <StatusBadge
                            statusClass={statusMeta.statusClass}
                            label={statusMeta.label}
                          />
                        </td>
                        <td data-label="Приоритет">
                          <PriorityBadge
                            className={priorityMeta.className}
                            icon={priorityMeta.icon}
                            label={priorityMeta.label}
                          />
                        </td>
                        <td data-label="Комментарий" className="comment-cell">
                          {leave.comment || '—'}
                        </td>
                        <td data-label="Действия" className="actions-cell">
                          <button
                            className="btn btn-sm btn-ghost"
                            type="button"
                            onClick={() => deleteLeave(leave.id)}
                            aria-label={`Удалить заявку ${employee.name}`}
                          >
                            Удалить
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <nav className="pagination" aria-label="Страницы заявок">
              <button
                className="pagination-btn"
                type="button"
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
                aria-label="Предыдущая страница"
              >
                ← <span className="pagination-text">Назад</span>
              </button>
              <p className="pagination-status" aria-live="polite">
                Страница {page} из {totalPages}
              </p>
              <button
                className="pagination-btn"
                type="button"
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages}
                aria-label="Следующая страница"
              >
                <span className="pagination-text">Вперёд</span> →
              </button>
            </nav>
          </>
        )}
      </section>
    </div>
  );
}
