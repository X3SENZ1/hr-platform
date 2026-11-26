import { useHr } from '../state/HrContext';
import {
  countCalendarDays,
  formatDateRange,
  MONTHS_NOM_RU,
  toISODate,
  TODAY_ISO,
} from '../lib/date';
import { LEAVE_STATUS_META, LEAVE_TYPE_META } from '../lib/meta';
import type { LeaveStatus } from '../types';
import { Avatar, StatusText } from '../components/ui';
import { IconChevronLeft, IconChevronRight } from '../components/icons';

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
    .filter(
      (leave) => ui.leaveStatusFilter === 'all' || leave.status === ui.leaveStatusFilter,
    )
    .slice()
    .sort((a, b) => b.startDate.localeCompare(a.startDate));

  const shiftMonth = (delta: number) => {
    const next = new Date(year, month + delta, 1);
    patchUi({ leaveMonth: { year: next.getFullYear(), month: next.getMonth() } });
  };

  const setStatusFilter = (value: string) => {
    patchUi({ leaveStatusFilter: value as 'all' | LeaveStatus });
  };

  return (
    <>
      {pendingLeaves.length > 0 && (
        <section className="card" style={{ marginBottom: 18 }}>
          <div className="card-header">
            <h2 className="card-title">Ожидают согласования ({pendingLeaves.length})</h2>
          </div>
          <div>
            {pendingLeaves.map((leave) => {
              const employee = getEmployee(leave.employeeId);
              if (!employee) return null;
              const typeMeta = LEAVE_TYPE_META[leave.type] ?? LEAVE_TYPE_META.vacation;
              const daysCount = countCalendarDays(leave.startDate, leave.endDate);
              const balance = getVacationBalance(employee);
              const overlaps = findDepartmentOverlaps(
                leave.employeeId,
                leave.startDate,
                leave.endDate,
                leave.id,
              );
              const conflictText =
                overlaps.length > 0 ? (
                  <div className="inline-warning">
                    Пересечение в отделе:{' '}
                    {overlaps
                      .map((item) => getEmployee(item.employeeId)?.name)
                      .filter(Boolean)
                      .join(', ')}
                  </div>
                ) : (
                  <div className="inline-ok">
                    Пересечений в отделе нет
                    {leave.comment ? ` · ${leave.comment}` : ''}
                  </div>
                );

              return (
                <div className="list-row" key={leave.id}>
                  <div
                    className="person-cell"
                    style={{ cursor: 'pointer' }}
                    role="button"
                    tabIndex={0}
                    onClick={() => openDrawer(employee.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        openDrawer(employee.id);
                      }
                    }}
                  >
                    <Avatar employee={employee} />
                    <div className="person-meta">
                      <div className="person-name">
                        {employee.name}{' '}
                        <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>
                          · {typeMeta.short}, {formatDateRange(leave.startDate, leave.endDate)} (
                          {daysCount} дн., остаток {balance.remaining} дн.)
                        </span>
                      </div>
                      {conflictText}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
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
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="card" style={{ marginBottom: 18 }}>
        <div className="card-header" style={{ flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              className="icon-btn"
              type="button"
              aria-label="Предыдущий месяц"
              onClick={() => shiftMonth(-1)}
            >
              <IconChevronLeft />
            </button>
            <h2 className="card-title" style={{ minWidth: 130, textAlign: 'center' }}>
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
            <select
              className="select"
              style={{ height: 28, fontSize: 12 }}
              value={ui.leaveDeptFilter}
              onChange={(event) => patchUi({ leaveDeptFilter: event.target.value })}
            >
              <option value="all">Все отделы</option>
              {data.departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <div className="timeline-legend">
              <span>
                <span className="legend-dot" style={{ background: '#BFDBFE' }} />
                Отпуск
              </span>
              <span>
                <span className="legend-dot" style={{ background: '#DDD6FE' }} />
                Отгул
              </span>
              <span>
                <span className="legend-dot" style={{ background: '#FECACA' }} />
                Больничный
              </span>
            </div>
            <button
              className="btn btn-sm btn-secondary"
              type="button"
              onClick={() =>
                patchUi({ leaveShowAllTimeline: !ui.leaveShowAllTimeline })
              }
            >
              {ui.leaveShowAllTimeline ? 'Только с отпусками' : 'Показать всех'}
            </button>
          </div>
        </div>
        <div className="timeline-wrap">
          <table className="timeline-table">
            <thead>
              <tr>
                <th>Сотрудник</th>
                {days.map((day) => (
                  <th
                    className={`timeline-day-th${day.isWeekend ? ' weekend' : ''}${day.isToday ? ' today' : ''}`}
                    key={day.iso}
                  >
                    {day.day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timelineEmployees.length === 0 ? (
                <tr>
                  <td
                    colSpan={daysInMonth + 1}
                    style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}
                  >
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
                      <td>
                        <div
                          className="person-cell"
                          style={{ cursor: 'pointer' }}
                          role="button"
                          tabIndex={0}
                          onClick={() => openDrawer(employee.id)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              openDrawer(employee.id);
                            }
                          }}
                        >
                          <Avatar employee={employee} size="sm" />
                          <div className="person-meta">
                            <div className="person-name">{employee.name}</div>
                          </div>
                        </div>
                      </td>
                      {days.map((day) => {
                        const match = employeeLeaves.find(
                          (leave) => leave.startDate <= day.iso && leave.endDate >= day.iso,
                        );
                        return (
                          <td
                            className={`timeline-cell${day.isWeekend ? ' weekend' : ''}${day.isToday ? ' today' : ''}`}
                            key={day.iso}
                          >
                            {match && (
                              <span
                                className={`timeline-bar ${match.type}${match.status === 'pending' ? ' pending' : ''}`}
                                title={`${employee.name}: ${(LEAVE_TYPE_META[match.type] ?? LEAVE_TYPE_META.vacation).short} (${formatDateRange(match.startDate, match.endDate)}) — ${(LEAVE_STATUS_META[match.status] ?? LEAVE_STATUS_META.approved).label}`}
                              />
                            )}
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
      </section>

      <section className="card">
        <div className="card-header" style={{ flexWrap: 'wrap' }}>
          <h2 className="card-title">Все заявки</h2>
          <div className="segmented">
            {(
              [
                ['all', 'Все'],
                ['pending', 'Ожидают'],
                ['approved', 'Одобрены'],
                ['rejected', 'Отклонены'],
              ] as const
            ).map(([value, label]) => (
              <button
                className={`segmented-btn${ui.leaveStatusFilter === value ? ' active' : ''}`}
                key={value}
                type="button"
                onClick={() => setStatusFilter(value)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Сотрудник</th>
                <th>Тип</th>
                <th>Период</th>
                <th>Длительность</th>
                <th>Статус</th>
                <th>Комментарий</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filteredRequests.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}
                  >
                    Заявок нет
                  </td>
                </tr>
              ) : (
                filteredRequests.map((leave) => {
                  const employee = getEmployee(leave.employeeId);
                  if (!employee) return null;
                  const typeMeta = LEAVE_TYPE_META[leave.type] ?? LEAVE_TYPE_META.vacation;
                  const statusMeta =
                    LEAVE_STATUS_META[leave.status] ?? LEAVE_STATUS_META.pending;
                  const daysCount = countCalendarDays(leave.startDate, leave.endDate);
                  return (
                    <tr key={leave.id}>
                      <td>
                        <div
                          className="person-cell"
                          style={{ cursor: 'pointer' }}
                          role="button"
                          tabIndex={0}
                          onClick={() => openDrawer(employee.id)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              openDrawer(employee.id);
                            }
                          }}
                        >
                          <Avatar employee={employee} size="sm" />
                          <div className="person-meta">
                            <div className="person-name">{employee.name}</div>
                          </div>
                        </div>
                      </td>
                      <td>{typeMeta.label}</td>
                      <td className="tabular">
                        {formatDateRange(leave.startDate, leave.endDate)}
                      </td>
                      <td className="tabular">{daysCount} дн.</td>
                      <td>
                        <StatusText
                          statusClass={statusMeta.statusClass}
                          label={statusMeta.label}
                        />
                      </td>
                      <td
                        style={{
                          color: 'var(--text-secondary)',
                          maxWidth: 250,
                        }}
                      >
                        {leave.comment || '—'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn btn-sm btn-ghost"
                          type="button"
                          onClick={() => deleteLeave(leave.id)}
                        >
                          Удалить
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
