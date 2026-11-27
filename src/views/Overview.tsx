import type { MouseEvent } from 'react';
import { useHr } from '../state/HrContext';
import { countCalendarDays, formatDateFull, formatDateRange, pluralize, TODAY_ISO } from '../lib/date';
import { LEAVE_PRIORITY_META, LEAVE_TYPE_META } from '../lib/meta';
import { Avatar, CountUp, EmptyState, PriorityBadge, ProgressBar } from '../components/ui';

export function Overview() {
  const {
    data,
    getEmployee,
    getOnboardingProgress,
    getActiveLeaveForEmployee,
    getUpcomingBirthdays,
    findDepartmentOverlaps,
    decideLeave,
    goTo,
    openDrawer,
    openDepartment,
    jumpToOnboarding,
  } = useHr();

  const totalEmployees = data.employees.length;
  const probationCount = data.employees.filter((employee) => employee.status === 'probation').length;
  const activeTracks = data.onboarding.filter(
    (track) => getOnboardingProgress(track).percent < 100,
  );
  const averageOnboarding = activeTracks.length
    ? Math.round(
        activeTracks.reduce((sum, track) => sum + getOnboardingProgress(track).percent, 0) /
          activeTracks.length,
      )
    : 100;
  const outToday = data.employees.filter((employee) =>
    Boolean(getActiveLeaveForEmployee(employee.id, TODAY_ISO)),
  );
  const pendingLeaves = data.leaves.filter((leave) => leave.status === 'pending');
  const openRolesTotal = data.departments.reduce(
    (sum, department) => sum + (department.openRoles || 0),
    0,
  );
  const upcomingLeaves = data.leaves
    .filter((leave) => leave.status === 'approved' && leave.endDate >= TODAY_ISO)
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
    .slice(0, 4);
  const birthdays = getUpcomingBirthdays().slice(0, 2);
  const maxDepartmentSize = Math.max(
    1,
    ...data.departments.map(
      (department) =>
        data.employees.filter((employee) => employee.departmentId === department.id).length,
    ),
  );

  const handleApprovalClick = (event: MouseEvent<HTMLUListElement>) => {
    const target = (event.target as HTMLElement).closest<HTMLElement>('[data-action]');
    if (!target) return;
    const action = target.dataset.action;
    const leaveId = target.dataset.leaveId;
    if (action === 'open' && target.dataset.employeeId) {
      openDrawer(target.dataset.employeeId);
    } else if (leaveId && action === 'approve') {
      decideLeave(leaveId, 'approved');
    } else if (leaveId && action === 'reject') {
      decideLeave(leaveId, 'rejected');
    }
  };

  return (
    <div className="dashboard">
      <section className="metrics-section" aria-labelledby="metrics-title">
        <h2 id="metrics-title" className="visually-hidden">
          Ключевые показатели
        </h2>
        <ul className="metrics-grid">
          <li>
            <button className="metric-cell" type="button" onClick={() => goTo('employees')}>
              <span className="metric-label">Сотрудники</span>
              <span className="metric-val">
                <CountUp value={totalEmployees} />
              </span>
              <span className="metric-note">
                {totalEmployees - probationCount} в штате · {probationCount} на испытательном
              </span>
            </button>
          </li>
          <li>
            <button className="metric-cell" type="button" onClick={() => goTo('onboarding')}>
              <span className="metric-label">На онбординге</span>
              <span className="metric-val">
                <CountUp value={activeTracks.length} />
              </span>
              <span className="metric-note">Средний прогресс {averageOnboarding}%</span>
            </button>
          </li>
          <li>
            <button className="metric-cell" type="button" onClick={() => goTo('leaves')}>
              <span className="metric-label">Отсутствуют сегодня</span>
              <span className="metric-val">
                <CountUp value={outToday.length} />
              </span>
              <span className="metric-note">
                {outToday.length
                  ? outToday.map((employee) => employee.name.split(' ')[0]).join(', ')
                  : 'Вся команда на месте'}
              </span>
            </button>
          </li>
          <li>
            <button className="metric-cell" type="button" onClick={() => goTo('leaves')}>
              <span className="metric-label">На согласовании</span>
              <span className="metric-val">
                <CountUp value={pendingLeaves.length} />
              </span>
              <span className="metric-note">
                {pendingLeaves.length ? 'Заявки на отпуск и отгул' : 'Очередь пуста'}
              </span>
            </button>
          </li>
        </ul>
      </section>

      <div className="dashboard-grid">
        <div className="stack">
          <section className="card" aria-labelledby="pending-title">
            <header className="card-header">
              <div>
                <h2 className="card-title" id="pending-title">
                  Заявки на согласование
                </h2>
                <p className="card-subtitle">{pendingLeaves.length} ожидают решения</p>
              </div>
              <button className="btn btn-sm btn-ghost" type="button" onClick={() => goTo('leaves')}>
                Все заявки →
              </button>
            </header>
            {pendingLeaves.length === 0 ? (
              <EmptyState
                title="Очередь пуста"
                text="Все заявки обработаны. Новые появятся здесь автоматически."
              />
            ) : (
              <ul className="list approval-list" onClick={handleApprovalClick}>
                {pendingLeaves.map((leave) => {
                  const employee = getEmployee(leave.employeeId);
                  if (!employee) return null;
                  const typeMeta = LEAVE_TYPE_META[leave.type] ?? LEAVE_TYPE_META.vacation;
                  const priorityMeta = LEAVE_PRIORITY_META[leave.priority ?? 'normal'];
                  const days = countCalendarDays(leave.startDate, leave.endDate);
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
                          · {days} {pluralize(days, ['день', 'дня', 'дней'])}
                        </p>
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
                            data-action="approve"
                            data-leave-id={leave.id}
                          >
                            Одобрить
                          </button>
                          <button
                            className="btn btn-sm btn-secondary"
                            type="button"
                            data-action="reject"
                            data-leave-id={leave.id}
                          >
                            Отклонить
                          </button>
                          <button
                            className="btn btn-sm btn-ghost"
                            type="button"
                            data-action="open"
                            data-employee-id={employee.id}
                          >
                            Профиль
                          </button>
                        </footer>
                      </article>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="card" aria-labelledby="onboarding-title">
            <header className="card-header">
              <div>
                <h2 className="card-title" id="onboarding-title">
                  Активный онбординг
                </h2>
                <p className="card-subtitle">Средний прогресс {averageOnboarding}%</p>
              </div>
              <button
                className="btn btn-sm btn-ghost"
                type="button"
                onClick={() => goTo('onboarding')}
              >
                К планам →
              </button>
            </header>
            {activeTracks.length === 0 ? (
              <EmptyState title="Активных планов нет" text="Все новички уже завершили адаптацию." />
            ) : (
              <ul className="list">
                {activeTracks.map((track) => {
                  const employee = getEmployee(track.employeeId);
                  if (!employee) return null;
                  const buddy = getEmployee(track.buddyId);
                  const progress = getOnboardingProgress(track);
                  return (
                    <li key={track.id}>
                      <button
                        className="list-row list-row-button"
                        type="button"
                        onClick={() => jumpToOnboarding(track.id)}
                      >
                        <span className="person-cell">
                          <Avatar employee={employee} />
                          <span className="person-meta">
                            <span className="person-name">{employee.name}</span>
                            <span className="person-sub">
                              {employee.role}
                              {buddy ? ` · бадди ${buddy.name.split(' ')[0]}` : ''}
                            </span>
                          </span>
                        </span>
                        <span className="progress-cell">
                          <span className="tabular progress-caption">
                            {progress.done} из {progress.total} · {progress.percent}%
                          </span>
                          <ProgressBar
                            percent={progress.percent}
                            label={`Онбординг ${employee.name}`}
                          />
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        <div className="stack">
          <section className="card" aria-labelledby="departments-title">
            <header className="card-header">
              <div>
                <h2 className="card-title" id="departments-title">
                  Отделы
                </h2>
                <p className="card-subtitle">Открыто вакансий: {openRolesTotal}</p>
              </div>
              <button
                className="btn btn-sm btn-ghost"
                type="button"
                onClick={() => goTo('structure')}
              >
                Структура →
              </button>
            </header>
            <figure className="dept-figure">
              <ul className="dept-bars">
                {data.departments.map((department) => {
                  const count = data.employees.filter(
                    (employee) => employee.departmentId === department.id,
                  ).length;
                  return (
                    <li className="dept-bar-row" key={department.id}>
                      <span className="dept-bar-label">{department.name}</span>
                      <span className="dept-bar-track" aria-hidden="true">
                        <span
                          className="dept-bar-fill"
                          style={{
                            width: `${Math.max(8, (count / maxDepartmentSize) * 100)}%`,
                            background: department.color,
                          }}
                        />
                      </span>
                      <span className="dept-bar-value tabular">{count}</span>
                    </li>
                  );
                })}
              </ul>
              <figcaption>
                Распределение {totalEmployees} сотрудников по {data.departments.length} отделам
              </figcaption>
            </figure>
            <ul className="list">
              {data.departments.map((department) => {
                const count = data.employees.filter(
                  (employee) => employee.departmentId === department.id,
                ).length;
                return (
                  <li key={department.id}>
                    <button
                      className="list-row list-row-button"
                      type="button"
                      onClick={() => openDepartment(department.id)}
                    >
                      <span className="dept-cell">
                        <span
                          className="dept-dot"
                          style={{ background: department.color }}
                          aria-hidden="true"
                        />
                        {department.name}
                      </span>
                      <span className="tabular dept-count">
                        {count} чел.
                        {department.openRoles ? (
                          <span className="link-text"> · +{department.openRoles} вак.</span>
                        ) : null}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="card" aria-labelledby="calendar-title">
            <header className="card-header">
              <div>
                <h2 className="card-title" id="calendar-title">
                  Календарь команды
                </h2>
                <p className="card-subtitle">Ближайшие две недели</p>
              </div>
              <button className="btn btn-sm btn-ghost" type="button" onClick={() => goTo('leaves')}>
                График →
              </button>
            </header>
            {upcomingLeaves.length + birthdays.length === 0 ? (
              <EmptyState title="Ближайших событий нет" text="Отпуска и дни рождения появятся здесь." />
            ) : (
              <ul className="list">
                {upcomingLeaves.map((leave) => {
                  const employee = getEmployee(leave.employeeId);
                  if (!employee) return null;
                  const typeMeta = LEAVE_TYPE_META[leave.type] ?? LEAVE_TYPE_META.vacation;
                  const isNow = leave.startDate <= TODAY_ISO && leave.endDate >= TODAY_ISO;
                  return (
                    <li key={leave.id}>
                      <button
                        className="list-row list-row-button"
                        type="button"
                        onClick={() => openDrawer(employee.id)}
                      >
                        <span className="person-cell">
                          <Avatar employee={employee} size="sm" />
                          <span className="person-meta">
                            <span className="person-name">{employee.name}</span>
                            <span className="person-sub">{typeMeta.short}</span>
                          </span>
                        </span>
                        <span className={`tabular event-date${isNow ? ' now' : ''}`}>
                          {isNow ? 'сейчас · ' : ''}
                          <time dateTime={leave.startDate}>
                            {formatDateRange(leave.startDate, leave.endDate)}
                          </time>
                        </span>
                      </button>
                    </li>
                  );
                })}
                {birthdays.map((birthday) => {
                  const when =
                    birthday.daysUntil === 0
                      ? 'сегодня'
                      : birthday.daysUntil === 1
                        ? 'завтра'
                        : birthday.dateStr;
                  return (
                    <li key={`bday-${birthday.employee.id}`}>
                      <button
                        className="list-row list-row-button"
                        type="button"
                        onClick={() => openDrawer(birthday.employee.id)}
                      >
                        <span className="person-cell">
                          <Avatar employee={birthday.employee} size="sm" />
                          <span className="person-meta">
                            <span className="person-name">{birthday.employee.name}</span>
                            <span className="person-sub">День рождения</span>
                          </span>
                        </span>
                        <span className="tabular event-date">
                          <time dateTime={birthday.dateIso}>{when}</time>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="card highlight-card" aria-labelledby="focus-title">
            <header className="card-header">
              <div>
                <h2 className="card-title" id="focus-title">
                  Фокус недели
                </h2>
                <p className="card-subtitle">Что важно не пропустить</p>
              </div>
            </header>
            <ul className="focus-list">
              <li>
                <span className="focus-icon" aria-hidden="true">
                  ✓
                </span>
                <span>
                  Закрыть {pendingLeaves.length} заявок на согласование
                </span>
              </li>
              <li>
                <span className="focus-icon" aria-hidden="true">
                  →
                </span>
                <span>
                  Провести чек-ины с {activeTracks.length} новичками ·{' '}
                  <time dateTime={TODAY_ISO}>{formatDateFull(TODAY_ISO)}</time>
                </span>
              </li>
              <li>
                <span className="focus-icon" aria-hidden="true">
                  ★
                </span>
                <span>Поздравить команду с ближайшими днями рождения</span>
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
