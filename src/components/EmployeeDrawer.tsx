import { useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from 'react';
import { useHr } from '../state/HrContext';
import { formatDateFull, formatDateRange, formatTenure } from '../lib/date';
import { useBodyScrollLock, useFocusTrap } from '../lib/hooks';
import { EMPLOYEE_FORMATS, LEAVE_STATUS_META, LEAVE_TYPE_META } from '../lib/meta';
import type { DrawerTab } from '../types';
import { Avatar, ProgressBar, StatusBadge, TagList } from '../components/ui';
import { IconClose } from '../components/icons';

const TABS: Array<{ key: DrawerTab; label: string }> = [
  { key: 'profile', label: 'Профиль' },
  { key: 'leaves', label: 'Отпуска' },
  { key: 'onb', label: 'Онбординг' },
];

export function EmployeeDrawer() {
  const {
    data,
    ui,
    getEmployee,
    getDepartment,
    getEmployeeStatusMeta,
    getVacationBalance,
    getOnboardingForEmployee,
    getOnboardingProgress,
    closeDrawer,
    setDrawerTab,
    toggleDrawerEditing,
    openModal,
    updateEmployee,
    toggleProbation,
    jumpToOnboarding,
    openDrawer,
  } = useHr();

  const drawerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Partial<Record<DrawerTab, HTMLButtonElement | null>>>({});
  const [editErrors, setEditErrors] = useState<{ role?: string; city?: string }>({});

  const employee = getEmployee(ui.drawerEmployeeId);
  const isOpen = Boolean(employee);
  useBodyScrollLock(isOpen);
  useFocusTrap(isOpen, drawerRef);

  const department = employee ? getDepartment(employee.departmentId) : null;
  const manager = employee?.managerId ? getEmployee(employee.managerId) : null;
  const reports = employee
    ? data.employees.filter((item) => item.managerId === employee.id)
    : [];
  const status = employee ? getEmployeeStatusMeta(employee) : null;
  const balance = employee ? getVacationBalance(employee) : null;
  const onboarding = employee ? getOnboardingForEmployee(employee.id) : null;
  const employeeLeaves = employee
    ? data.leaves
        .filter((leave) => leave.employeeId === employee.id)
        .sort((a, b) => b.startDate.localeCompare(a.startDate))
    : [];

  const handleSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!employee) return;
    const formData = new FormData(event.currentTarget);
    const role = String(formData.get('role') || '').trim();
    const city = String(formData.get('city') || '').trim();
    const nextErrors: { role?: string; city?: string } = {};
    if (role.length < 2) nextErrors.role = 'Укажите должность — минимум 2 символа.';
    if (city.length > 60) nextErrors.city = 'Не более 60 символов.';
    setEditErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      document.getElementById(nextErrors.role ? 'drawer-role' : 'drawer-city')?.focus();
      return;
    }
    updateEmployee(employee.id, {
      role,
      departmentId: String(formData.get('departmentId') || employee.departmentId),
      format: String(formData.get('format') || employee.format),
      city,
      telegram: String(formData.get('telegram') || '').trim(),
      phone: String(formData.get('phone') || '').trim(),
    });
    setEditErrors({});
    toggleDrawerEditing();
  };

  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const currentIndex = TABS.findIndex((tab) => tab.key === ui.drawerTab);
    let nextIndex = currentIndex;
    if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % TABS.length;
    else if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + TABS.length) % TABS.length;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = TABS.length - 1;
    else return;
    event.preventDefault();
    const next = TABS[nextIndex];
    setDrawerTab(next.key);
    tabRefs.current[next.key]?.focus();
  };

  let body: ReactNode = null;

  if (employee && balance) {
    if (ui.drawerEditing) {
      body = (
        <form className="form-grid drawer-form" onSubmit={handleSave} noValidate key={employee.id}>
          <div className="form-field full">
            <label htmlFor="drawer-role">Должность *</label>
            <input
              id="drawer-role"
              type="text"
              name="role"
              defaultValue={employee.role}
              aria-invalid={Boolean(editErrors.role)}
              aria-describedby={editErrors.role ? 'drawer-role-error' : undefined}
            />
            {editErrors.role ? (
              <p className="field-error" id="drawer-role-error" role="alert">
                {editErrors.role}
              </p>
            ) : null}
          </div>
          <div className="form-field">
            <label htmlFor="drawer-departmentId">Отдел</label>
            <select id="drawer-departmentId" name="departmentId" defaultValue={employee.departmentId}>
              {data.departments.map((item) => (
                <option value={item.id} key={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="drawer-format">Формат</label>
            <select id="drawer-format" name="format" defaultValue={employee.format}>
              {EMPLOYEE_FORMATS.map((format) => (
                <option value={format} key={format}>
                  {format}
                </option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="drawer-city">Город</label>
            <input
              id="drawer-city"
              type="text"
              name="city"
              defaultValue={employee.city}
              aria-invalid={Boolean(editErrors.city)}
              aria-describedby={editErrors.city ? 'drawer-city-error' : undefined}
            />
            {editErrors.city ? (
              <p className="field-error" id="drawer-city-error" role="alert">
                {editErrors.city}
              </p>
            ) : null}
          </div>
          <div className="form-field">
            <label htmlFor="drawer-telegram">Telegram</label>
            <input
              id="drawer-telegram"
              type="text"
              name="telegram"
              defaultValue={employee.telegram || ''}
            />
          </div>
          <div className="form-field full">
            <label htmlFor="drawer-phone">Телефон</label>
            <input
              id="drawer-phone"
              type="tel"
              name="phone"
              defaultValue={employee.phone || ''}
            />
          </div>
          <div className="form-actions full">
            <button className="btn btn-secondary" type="button" onClick={toggleDrawerEditing}>
              Отмена
            </button>
            <button className="btn btn-primary" type="submit">
              Сохранить
            </button>
          </div>
        </form>
      );
    } else if (ui.drawerTab === 'profile') {
      body = (
        <>
          <section className="drawer-section" aria-labelledby="drawer-contacts-title">
            <h3 className="drawer-section-title" id="drawer-contacts-title">
              Контакты и работа
            </h3>
            <dl className="info-grid">
              <div>
                <dt className="info-item-label">Email</dt>
                <dd className="info-item-value">
                  <a href={`mailto:${employee.email}`}>{employee.email}</a>
                </dd>
              </div>
              <div>
                <dt className="info-item-label">Telegram</dt>
                <dd className="info-item-value">{employee.telegram || '—'}</dd>
              </div>
              <div>
                <dt className="info-item-label">Локация</dt>
                <dd className="info-item-value">
                  {employee.format} · {employee.city} ({employee.timezone || 'МСК'})
                </dd>
              </div>
              <div>
                <dt className="info-item-label">Телефон</dt>
                <dd className="info-item-value">
                  {employee.phone ? <a href={`tel:${employee.phone.replace(/[^\d+]/g, '')}`}>{employee.phone}</a> : '—'}
                </dd>
              </div>
              <div>
                <dt className="info-item-label">В команде с</dt>
                <dd className="info-item-value">
                  <time dateTime={employee.startDate}>{formatDateFull(employee.startDate)}</time>{' '}
                  ({formatTenure(employee.startDate)})
                </dd>
              </div>
              <div>
                <dt className="info-item-label">Руководитель</dt>
                <dd className="info-item-value">
                  {manager ? (
                    <button className="link-btn" type="button" onClick={() => openDrawer(manager.id)}>
                      {manager.name}
                    </button>
                  ) : (
                    '—'
                  )}
                </dd>
              </div>
              <div>
                <dt className="info-item-label">Экстренный контакт</dt>
                <dd className="info-item-value">
                  {employee.contacts?.emergencyName || '—'}
                  {employee.contacts?.emergencyPhone ? ` · ${employee.contacts.emergencyPhone}` : ''}
                </dd>
              </div>
              <div>
                <dt className="info-item-label">Техника</dt>
                <dd className="info-item-value">
                  {employee.equipment?.laptop || '—'}
                  {employee.equipment?.monitor ? ` · ${employee.equipment.monitor}` : ''}
                </dd>
              </div>
            </dl>
            <TagList tags={employee.skills} label="Навыки" />
          </section>

          {reports.length > 0 ? (
            <section className="drawer-section" aria-labelledby="drawer-reports-title">
              <h3 className="drawer-section-title" id="drawer-reports-title">
                В подчинении ({reports.length})
              </h3>
              <div className="button-row">
                {reports.map((report) => (
                  <button
                    className="btn btn-sm btn-secondary"
                    key={report.id}
                    type="button"
                    onClick={() => openDrawer(report.id)}
                  >
                    {report.name}
                  </button>
                ))}
              </div>
            </section>
          ) : null}
        </>
      );
    } else if (ui.drawerTab === 'leaves') {
      body = (
        <>
          <section className="drawer-section" aria-labelledby="drawer-balance-title">
            <h3 className="drawer-section-title" id="drawer-balance-title">
              Баланс отпуска
            </h3>
            <dl className="balance-grid">
              <div>
                <dt className="info-item-label">Доступно</dt>
                <dd className="balance-value">{balance.remaining} дн.</dd>
              </div>
              <div>
                <dt className="info-item-label">Использовано</dt>
                <dd className="balance-value muted">{balance.used} дн.</dd>
              </div>
              <div>
                <dt className="info-item-label">Лимит</dt>
                <dd className="balance-value muted">{balance.total} дн.</dd>
              </div>
            </dl>
            <button
              className="btn btn-primary"
              type="button"
              onClick={() => openModal('addLeave', { employeeId: employee.id })}
            >
              + Оформить заявку
            </button>
          </section>
          <section className="drawer-section" aria-labelledby="drawer-history-title">
            <h3 className="drawer-section-title" id="drawer-history-title">
              История заявок
            </h3>
            {employeeLeaves.length ? (
              <ul className="drawer-list">
                {employeeLeaves.map((leave) => {
                  const typeMeta = LEAVE_TYPE_META[leave.type] ?? LEAVE_TYPE_META.vacation;
                  const statusMeta = LEAVE_STATUS_META[leave.status] ?? LEAVE_STATUS_META.pending;
                  return (
                    <li className="drawer-list-item" key={leave.id}>
                      <span>
                        <strong>{typeMeta.short}</strong> ·{' '}
                        <time dateTime={leave.startDate}>{formatDateRange(leave.startDate, leave.endDate)}</time>
                      </span>
                      <StatusBadge statusClass={statusMeta.statusClass} label={statusMeta.label} />
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="muted-text">Заявок пока нет</p>
            )}
          </section>
        </>
      );
    } else {
      body = onboarding ? (
        <section className="drawer-section" aria-labelledby="drawer-onb-title">
          <h3 className="drawer-section-title" id="drawer-onb-title">
            Адаптация
          </h3>
          <p className="drawer-progress-line">
            <span>Прогресс</span>
            <strong className="tabular">
              {getOnboardingProgress(onboarding).done} / {getOnboardingProgress(onboarding).total} ·{' '}
              {getOnboardingProgress(onboarding).percent}%
            </strong>
          </p>
          <ProgressBar percent={getOnboardingProgress(onboarding).percent} label="Прогресс адаптации" />
          {onboarding.notes ? <p className="muted-text">{onboarding.notes}</p> : null}
          <button
            className="link-btn"
            type="button"
            onClick={() => jumpToOnboarding(onboarding.id)}
          >
            Открыть чек-лист →
          </button>
        </section>
      ) : (
        <p className="muted-text">Активного плана онбординга нет.</p>
      );
    }
  }

  return (
    <>
      <button
        id="drawerBackdrop"
        className={`drawer-backdrop${isOpen ? ' open' : ''}`}
        type="button"
        tabIndex={isOpen ? 0 : -1}
        aria-label="Закрыть карточку сотрудника"
        onClick={closeDrawer}
      />
      <div
        ref={drawerRef}
        id="employeeDrawer"
        className={`drawer${isOpen ? ' open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawerTitle"
        aria-hidden={!isOpen}
        inert={!isOpen}
        tabIndex={-1}
      >
        <header className="drawer-header">
          <div>
            <p className="modal-eyebrow">Карточка сотрудника</p>
            <h2 id="drawerTitle" className="drawer-title">
              {employee?.name ?? 'Сотрудник'}
            </h2>
          </div>
          <div className="drawer-header-actions">
            <button
              className="btn btn-sm btn-secondary"
              type="button"
              onClick={() => {
                setEditErrors({});
                toggleDrawerEditing();
              }}
              disabled={!employee}
            >
              {ui.drawerEditing ? 'Отмена' : 'Изменить'}
            </button>
            <button className="icon-btn" type="button" aria-label="Закрыть карточку" onClick={closeDrawer}>
              <IconClose />
            </button>
          </div>
        </header>

        <div className="drawer-body">
          {employee && status && balance ? (
            <>
              <div className="drawer-person">
                <Avatar employee={employee} size="lg" />
                <div className="drawer-person-info">
                  <p className="drawer-person-name">{employee.name}</p>
                  <p className="drawer-person-role">
                    {employee.role}
                    {department ? ` · ${department.name}` : ''}
                  </p>
                  <StatusBadge statusClass={status.statusClass} label={status.label} />
                </div>
              </div>

              <div className="button-row">
                <button
                  className="btn btn-sm btn-secondary"
                  type="button"
                  onClick={() => openModal('addLeave', { employeeId: employee.id })}
                >
                  Оформить отпуск
                </button>
                <button
                  className="btn btn-sm btn-secondary"
                  type="button"
                  onClick={() => toggleProbation(employee.id)}
                >
                  {employee.status === 'probation' ? 'Перевести в штат' : 'Испытательный срок'}
                </button>
              </div>

              {!ui.drawerEditing ? (
                <div className="drawer-tabs" role="tablist" aria-label="Разделы карточки">
                  {TABS.map((tab) => (
                    <button
                      key={tab.key}
                      ref={(node) => {
                        tabRefs.current[tab.key] = node;
                      }}
                      id={`drawer-tab-${tab.key}`}
                      className={`drawer-tab${ui.drawerTab === tab.key ? ' active' : ''}`}
                      type="button"
                      role="tab"
                      aria-selected={ui.drawerTab === tab.key}
                      aria-controls={`drawer-panel-${tab.key}`}
                      tabIndex={ui.drawerTab === tab.key ? 0 : -1}
                      onClick={() => setDrawerTab(tab.key)}
                      onKeyDown={handleTabKeyDown}
                    >
                      {tab.label}
                      {tab.key === 'leaves' ? ` (${balance.remaining} дн.)` : ''}
                    </button>
                  ))}
                </div>
              ) : null}

              <div
                id={`drawer-panel-${ui.drawerTab}`}
                role="tabpanel"
                aria-labelledby={`drawer-tab-${ui.drawerTab}`}
                tabIndex={0}
                className="drawer-panel"
              >
                {body}
              </div>
            </>
          ) : null}
        </div>

        <footer className="drawer-footer">
          <p className="drawer-footer-note">
            {employee ? `ID: ${employee.id}` : 'Выберите сотрудника'}
          </p>
          <div className="button-row">
            <button className="btn btn-secondary" type="button" onClick={closeDrawer}>
              Закрыть
            </button>
            {employee ? (
              <button
                className="btn btn-primary"
                type="button"
                onClick={() => openModal('addLeave', { employeeId: employee.id })}
              >
                Оформить отпуск
              </button>
            ) : null}
          </div>
        </footer>
      </div>
    </>
  );
}
