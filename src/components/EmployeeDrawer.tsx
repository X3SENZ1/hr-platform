import type { FormEvent, ReactNode } from 'react';
import { useHr } from '../state/HrContext';
import { formatDateFull, formatDateRange, formatTenure } from '../lib/date';
import { EMPLOYEE_FORMATS, LEAVE_STATUS_META, LEAVE_TYPE_META } from '../lib/meta';
import { Avatar, ProgressBar, StatusText } from '../components/ui';
import { IconClose } from '../components/icons';

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

  const employee = getEmployee(ui.drawerEmployeeId);
  const isOpen = Boolean(employee);

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
    updateEmployee(employee.id, {
      role: String(formData.get('role') || employee.role).trim(),
      departmentId: String(formData.get('departmentId') || employee.departmentId),
      format: String(formData.get('format') || employee.format),
      city: String(formData.get('city') || employee.city).trim(),
      telegram: String(formData.get('telegram') || '').trim(),
      phone: String(formData.get('phone') || '').trim(),
    });
    toggleDrawerEditing();
  };

  let body: ReactNode = null;

  if (employee && balance) {
    if (ui.drawerEditing) {
      body = (
        <form className="form-grid" onSubmit={handleSave} key={employee.id}>
          <label className="form-field full">
            <span>Должность</span>
            <input type="text" name="role" defaultValue={employee.role} required />
          </label>
          <label className="form-field">
            <span>Отдел</span>
            <select name="departmentId" defaultValue={employee.departmentId}>
              {data.departments.map((item) => (
                <option value={item.id} key={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label className="form-field">
            <span>Формат</span>
            <select name="format" defaultValue={employee.format}>
              {EMPLOYEE_FORMATS.map((format) => (
                <option value={format} key={format}>
                  {format}
                </option>
              ))}
            </select>
          </label>
          <label className="form-field">
            <span>Город</span>
            <input type="text" name="city" defaultValue={employee.city} />
          </label>
          <label className="form-field">
            <span>Telegram</span>
            <input type="text" name="telegram" defaultValue={employee.telegram || ''} />
          </label>
          <label className="form-field full">
            <span>Телефон</span>
            <input type="text" name="phone" defaultValue={employee.phone || ''} />
          </label>
          <div
            className="form-field full"
            style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 4 }}
          >
            <button className="btn btn-primary" type="submit">
              Сохранить
            </button>
          </div>
        </form>
      );
    } else if (ui.drawerTab === 'profile') {
      body = (
        <>
          <div className="drawer-section">
            <h3 className="drawer-section-title">Контакты и работа</h3>
            <div className="info-grid">
              <div>
                <div className="info-item-label">Email</div>
                <div className="info-item-value">{employee.email}</div>
              </div>
              <div>
                <div className="info-item-label">Telegram</div>
                <div className="info-item-value">{employee.telegram || '—'}</div>
              </div>
              <div>
                <div className="info-item-label">Локация</div>
                <div className="info-item-value">
                  {employee.format} · {employee.city} ({employee.timezone || 'МСК'})
                </div>
              </div>
              <div>
                <div className="info-item-label">Телефон</div>
                <div className="info-item-value">{employee.phone || '—'}</div>
              </div>
              <div>
                <div className="info-item-label">В команде с</div>
                <div className="info-item-value">
                  {formatDateFull(employee.startDate)} ({formatTenure(employee.startDate)})
                </div>
              </div>
              <div>
                <div className="info-item-label">Руководитель</div>
                <div className="info-item-value">
                  {manager ? (
                    <button
                      className="link-btn"
                      type="button"
                      onClick={() => openDrawer(manager.id)}
                    >
                      {manager.name}
                    </button>
                  ) : (
                    '—'
                  )}
                </div>
              </div>
            </div>
          </div>
          {reports.length > 0 && (
            <div className="drawer-section">
              <h3 className="drawer-section-title">В подчинении ({reports.length})</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
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
            </div>
          )}
        </>
      );
    } else if (ui.drawerTab === 'leaves') {
      body = (
        <>
          <div className="drawer-section">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '12px 14px',
                background: 'var(--surface-subtle)',
                border: '1px solid var(--border)',
                borderRadius: 8,
              }}
            >
              <div>
                <div className="info-item-label">Доступно</div>
                <div style={{ fontSize: 18, fontWeight: 600 }} className="tabular">
                  {balance.remaining} дн.
                </div>
              </div>
              <div>
                <div className="info-item-label">Использовано</div>
                <div
                  style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-secondary)' }}
                  className="tabular"
                >
                  {balance.used} дн.
                </div>
              </div>
              <div>
                <div className="info-item-label">Лимит</div>
                <div
                  style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-secondary)' }}
                  className="tabular"
                >
                  {balance.total} дн.
                </div>
              </div>
            </div>
            <button
              className="btn btn-primary"
              type="button"
              onClick={() => openModal('addLeave', { employeeId: employee.id })}
            >
              + Оформить заявку
            </button>
          </div>
          <div className="drawer-section">
            <h3 className="drawer-section-title">История</h3>
            {employeeLeaves.length ? (
              employeeLeaves.map((leave) => {
                const typeMeta = LEAVE_TYPE_META[leave.type] ?? LEAVE_TYPE_META.vacation;
                const statusMeta = LEAVE_STATUS_META[leave.status] ?? LEAVE_STATUS_META.pending;
                return (
                  <div
                    key={leave.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 10px',
                      border: '1px solid var(--border)',
                      borderRadius: 6,
                      fontSize: 12.5,
                    }}
                  >
                    <div>
                      <strong>{typeMeta.short}</strong> ·{' '}
                      <span className="tabular">
                        {formatDateRange(leave.startDate, leave.endDate)}
                      </span>
                    </div>
                    <StatusText
                      statusClass={statusMeta.statusClass}
                      label={statusMeta.label}
                    />
                  </div>
                );
              })
            ) : (
              <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>Заявок нет</div>
            )}
          </div>
        </>
      );
    } else {
      body = onboarding ? (
        <div className="drawer-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <span>Прогресс адаптации</span>
            <strong className="tabular">
              {getOnboardingProgress(onboarding).done} / {getOnboardingProgress(onboarding).total} (
              {getOnboardingProgress(onboarding).percent}%)
            </strong>
          </div>
          <ProgressBar percent={getOnboardingProgress(onboarding).percent} />
          <div>
            <button
              className="link-btn"
              type="button"
              onClick={() => jumpToOnboarding(onboarding.id)}
            >
              Открыть чек-лист →
            </button>
          </div>
        </div>
      ) : (
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          Активного плана онбординга нет
        </div>
      );
    }
  }

  return (
    <>
      <div
        id="drawerBackdrop"
        className={`drawer-backdrop${isOpen ? ' open' : ''}`}
        aria-hidden={!isOpen}
        onClick={closeDrawer}
      />
      <aside
        id="employeeDrawer"
        className={`drawer${isOpen ? ' open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawerTitle"
        aria-hidden={!isOpen}
      >
        <div className="drawer-header">
          <h2 id="drawerTitle" className="drawer-title">
            {employee?.name ?? 'Карточка сотрудника'}
          </h2>
          <div className="drawer-header-actions">
            <button
              className="btn btn-sm btn-secondary"
              type="button"
              onClick={toggleDrawerEditing}
              disabled={!employee}
            >
              {ui.drawerEditing ? 'Отмена' : 'Изменить'}
            </button>
            <button className="icon-btn" type="button" aria-label="Закрыть" onClick={closeDrawer}>
              <IconClose />
            </button>
          </div>
        </div>

        <div id="drawerContent" className="drawer-body">
          {employee && status && balance && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <Avatar employee={employee} size="lg" />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>{employee.name}</h2>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                    {employee.role}
                    {department ? ` · ${department.name}` : ''}
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <StatusText statusClass={status.statusClass} label={status.label} />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
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
                  {employee.status === 'probation' ? 'Перевести в штат' : 'Испытательный'}
                </button>
              </div>

              {!ui.drawerEditing && (
                <div className="drawer-tabs">
                  <button
                    className={`drawer-tab${ui.drawerTab === 'profile' ? ' active' : ''}`}
                    type="button"
                    onClick={() => setDrawerTab('profile')}
                  >
                    Профиль
                  </button>
                  <button
                    className={`drawer-tab${ui.drawerTab === 'leaves' ? ' active' : ''}`}
                    type="button"
                    onClick={() => setDrawerTab('leaves')}
                  >
                    Отпуска ({balance.remaining} дн.)
                  </button>
                  <button
                    className={`drawer-tab${ui.drawerTab === 'onb' ? ' active' : ''}`}
                    type="button"
                    onClick={() => setDrawerTab('onb')}
                  >
                    Онбординг
                  </button>
                </div>
              )}

              {body}
            </>
          )}
        </div>
      </aside>
    </>
  );
}
