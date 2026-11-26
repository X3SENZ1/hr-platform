import type { ReactNode } from 'react';
import { useHr } from '../state/HrContext';
import { countCalendarDays, formatDateRange, pluralize, TODAY_ISO } from '../lib/date';
import { LEAVE_TYPE_META } from '../lib/meta';
import { Avatar, ProgressBar } from '../components/ui';

function MetricCell({
  label,
  value,
  note,
  onClick,
}: {
  label: string;
  value: number;
  note: string;
  onClick: () => void;
}) {
  return (
    <div
      className="metric-cell"
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick();
        }
      }}
    >
      <div className="metric-label">{label}</div>
      <div className="metric-val">{value}</div>
      <div className="metric-note">{note}</div>
    </div>
  );
}

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
        activeTracks.reduce(
          (sum, track) => sum + getOnboardingProgress(track).percent,
          0,
        ) / activeTracks.length,
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

  const pendingContent: ReactNode =
    pendingLeaves.length === 0 ? (
      <div className="empty-state">
        <div className="empty-state-title">Очередь пуста</div>
        <div>Все заявки обработаны</div>
      </div>
    ) : (
      pendingLeaves.map((leave) => {
        const employee = getEmployee(leave.employeeId);
        if (!employee) return null;
        const typeMeta = LEAVE_TYPE_META[leave.type] ?? LEAVE_TYPE_META.vacation;
        const days = countCalendarDays(leave.startDate, leave.endDate);
        const overlaps = findDepartmentOverlaps(
          leave.employeeId,
          leave.startDate,
          leave.endDate,
          leave.id,
        );
        const overlapNote =
          overlaps.length > 0 ? (
            <div className="inline-warning">
              Пересечение в отделе:{' '}
              {overlaps
                .map((item) => getEmployee(item.employeeId)?.name)
                .filter(Boolean)
                .join(', ')}
            </div>
          ) : (
            <div className="inline-ok">Пересечений в отделе нет</div>
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
                    · {typeMeta.short}, {formatDateRange(leave.startDate, leave.endDate)} ({days}{' '}
                    {pluralize(days, ['день', 'дня', 'дней'])})
                  </span>
                </div>
                {overlapNote}
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
      })
    );

  const onboardingContent: ReactNode =
    activeTracks.length === 0 ? (
      <div className="empty-state">Активных планов онбординга нет</div>
    ) : (
      activeTracks.map((track) => {
        const employee = getEmployee(track.employeeId);
        if (!employee) return null;
        const buddy = getEmployee(track.buddyId);
        const progress = getOnboardingProgress(track);
        return (
          <div
            className="list-row list-row-clickable"
            key={track.id}
            role="button"
            tabIndex={0}
            onClick={() => jumpToOnboarding(track.id)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                jumpToOnboarding(track.id);
              }
            }}
          >
            <div className="person-cell">
              <Avatar employee={employee} />
              <div className="person-meta">
                <div className="person-name">{employee.name}</div>
                <div className="person-sub">
                  {employee.role}
                  {buddy ? ` · бадди ${buddy.name.split(' ')[0]}` : ''}
                </div>
              </div>
            </div>
            <div style={{ width: 130, textAlign: 'right' }}>
              <div
                className="tabular"
                style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 5 }}
              >
                {progress.done} из {progress.total} · {progress.percent}%
              </div>
              <ProgressBar percent={progress.percent} />
            </div>
          </div>
        );
      })
    );

  const departmentRows = data.departments.map((department) => {
    const count = data.employees.filter(
      (employee) => employee.departmentId === department.id,
    ).length;
    return (
      <div
        className="list-row list-row-clickable"
        key={department.id}
        role="button"
        tabIndex={0}
        onClick={() => openDepartment(department.id)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            openDepartment(department.id);
          }
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontWeight: 500 }}>
          <span className="dept-dot" style={{ background: department.color }} />
          {department.name}
        </div>
        <div className="tabular" style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>
          {count} чел.
          {department.openRoles ? (
            <span style={{ color: 'var(--link)' }}> · +{department.openRoles} вак.</span>
          ) : null}
        </div>
      </div>
    );
  });

  const upcomingLeaves = data.leaves
    .filter((leave) => leave.status === 'approved' && leave.endDate >= TODAY_ISO)
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
    .slice(0, 4);
  const birthdays = getUpcomingBirthdays().slice(0, 2);

  const scheduleRows: ReactNode[] = upcomingLeaves.map((leave) => {
    const employee = getEmployee(leave.employeeId);
    if (!employee) return null;
    const typeMeta = LEAVE_TYPE_META[leave.type] ?? LEAVE_TYPE_META.vacation;
    const isNow = leave.startDate <= TODAY_ISO && leave.endDate >= TODAY_ISO;
    return (
      <div
        className="list-row list-row-clickable"
        key={leave.id}
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
        <div className="person-cell">
          <Avatar employee={employee} size="sm" />
          <div className="person-meta">
            <div className="person-name">{employee.name}</div>
            <div className="person-sub">{typeMeta.short}</div>
          </div>
        </div>
        <span
          className="tabular"
          style={{
            fontSize: 12,
            color: isNow ? 'var(--info)' : 'var(--text-muted)',
            fontWeight: isNow ? 600 : 400,
          }}
        >
          {isNow ? 'сейчас · ' : ''}
          {formatDateRange(leave.startDate, leave.endDate)}
        </span>
      </div>
    );
  });

  const birthdayRows: ReactNode[] = birthdays.map((birthday) => {
    const when =
      birthday.daysUntil === 0
        ? 'сегодня'
        : birthday.daysUntil === 1
          ? 'завтра'
          : birthday.dateStr;
    return (
      <div
        className="list-row list-row-clickable"
        key={`bday-${birthday.employee.id}`}
        role="button"
        tabIndex={0}
        onClick={() => openDrawer(birthday.employee.id)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            openDrawer(birthday.employee.id);
          }
        }}
      >
        <div className="person-cell">
          <Avatar employee={birthday.employee} size="sm" />
          <div className="person-meta">
            <div className="person-name">{birthday.employee.name}</div>
            <div className="person-sub">День рождения</div>
          </div>
        </div>
        <span className="tabular" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {when}
        </span>
      </div>
    );
  });

  return (
    <>
      <section className="metrics-bar" aria-label="Ключевые показатели">
        <MetricCell
          label="Сотрудники"
          value={totalEmployees}
          note={`${totalEmployees - probationCount} в штате · ${probationCount} на испытательном`}
          onClick={() => goTo('employees')}
        />
        <MetricCell
          label="На онбординге"
          value={activeTracks.length}
          note={`Средний прогресс ${averageOnboarding}%`}
          onClick={() => goTo('onboarding')}
        />
        <MetricCell
          label="Отсутствуют сегодня"
          value={outToday.length}
          note={
            outToday.length
              ? outToday.map((employee) => employee.name.split(' ')[0]).join(', ')
              : 'Вся команда на месте'
          }
          onClick={() => goTo('leaves')}
        />
        <MetricCell
          label="На согласовании"
          value={pendingLeaves.length}
          note={pendingLeaves.length ? 'Заявки на отпуск и отгул' : 'Очередь пуста'}
          onClick={() => goTo('leaves')}
        />
      </section>

      <div className="dashboard-grid">
        <div className="stack">
          <section className="card">
            <div className="card-header">
              <div>
                <h2 className="card-title">Заявки на согласование</h2>
              </div>
              <button className="btn btn-sm btn-ghost" type="button" onClick={() => goTo('leaves')}>
                Все заявки →
              </button>
            </div>
            <div>{pendingContent}</div>
          </section>

          <section className="card">
            <div className="card-header">
              <div>
                <h2 className="card-title">Активный онбординг</h2>
              </div>
              <button
                className="btn btn-sm btn-ghost"
                type="button"
                onClick={() => goTo('onboarding')}
              >
                К планам →
              </button>
            </div>
            <div>{onboardingContent}</div>
          </section>
        </div>

        <div className="stack">
          <section className="card">
            <div className="card-header">
              <div>
                <h2 className="card-title">Отделы</h2>
              </div>
              <span className="card-subtitle">Открыто вакансий: {openRolesTotal}</span>
            </div>
            <div>{departmentRows}</div>
          </section>

          <section className="card">
            <div className="card-header">
              <div>
                <h2 className="card-title">Календарь команды</h2>
              </div>
              <button className="btn btn-sm btn-ghost" type="button" onClick={() => goTo('leaves')}>
                График →
              </button>
            </div>
            <div>
              {scheduleRows.length + birthdayRows.length === 0 ? (
                <div className="empty-state">Ближайших событий нет</div>
              ) : (
                <>
                  {scheduleRows}
                  {birthdayRows}
                </>
              )}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
