import { useHr } from '../../state/HrContext';
import { Avatar } from '../ui';
import { IconSearch } from '../icons';

export function CommandPalette() {
  const {
    data,
    ui,
    patchUi,
    closeModal,
    openDrawer,
    openModal,
    goTo,
    getDepartment,
  } = useHr();

  const query = ui.commandQuery.trim().toLowerCase();

  const actions = [
    {
      label: 'Добавить сотрудника',
      hint: 'Штат',
      run: () => openModal('addEmployee'),
    },
    {
      label: 'Оформить отпуск / отгул',
      hint: 'Отпуска',
      run: () => openModal('addLeave'),
    },
    {
      label: 'Открыть оргсхему',
      hint: 'Структура',
      run: () => {
        closeModal();
        goTo('structure');
      },
    },
    {
      label: 'Перейти к онбордингу',
      hint: 'Онбординг',
      run: () => {
        closeModal();
        goTo('onboarding');
      },
    },
  ].filter((action) => !query || action.label.toLowerCase().includes(query));

  const employees = data.employees
    .filter((employee) => {
      if (!query) return true;
      return `${employee.name} ${employee.role} ${employee.city}`.toLowerCase().includes(query);
    })
    .slice(0, 6);

  return (
    <div
      id="commandModal"
      className="modal command-modal"
      role="dialog"
      aria-modal="true"
      aria-label="Быстрый поиск"
    >
      <div className="command-input-wrap">
        <IconSearch />
        <input
          id="commandInput"
          type="text"
          placeholder="Найти сотрудника, отдел или действие..."
          autoComplete="off"
          autoFocus
          value={ui.commandQuery}
          onChange={(event) => patchUi({ commandQuery: event.target.value })}
        />
        <button className="kbd" type="button" onClick={closeModal}>
          Esc
        </button>
      </div>
      <div id="commandResults" className="command-results">
        {employees.length > 0 && (
          <>
            <div className="command-group-title">Сотрудники</div>
            {employees.map((employee) => {
              const department = getDepartment(employee.departmentId);
              return (
                <button
                  className="command-item"
                  key={employee.id}
                  type="button"
                  onClick={() => {
                    closeModal();
                    openDrawer(employee.id);
                  }}
                >
                  <div className="person-cell">
                    <Avatar employee={employee} size="sm" />
                    <div className="person-meta">
                      <div className="person-name">{employee.name}</div>
                      <div className="person-sub">
                        {employee.role}
                        {department ? ` · ${department.name}` : ''}
                      </div>
                    </div>
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Открыть →</span>
                </button>
              );
            })}
          </>
        )}

        {actions.length > 0 && (
          <>
            <div className="command-group-title">Действия</div>
            {actions.map((action) => (
              <button
                className="command-item"
                key={action.label}
                type="button"
                onClick={action.run}
              >
                <span>{action.label}</span>
                <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                  {action.hint}
                </span>
              </button>
            ))}
          </>
        )}

        {employees.length === 0 && actions.length === 0 && (
          <div className="empty-state" style={{ padding: 20 }}>
            Ничего не найдено
          </div>
        )}
      </div>
    </div>
  );
}
