import { useHr } from '../state/HrContext';
import { Avatar, StatusText } from '../components/ui';

export function Employees() {
  const {
    data,
    ui,
    patchUi,
    getEmployee,
    getDepartment,
    getEmployeeStatusMeta,
    getVacationBalance,
    openDrawer,
  } = useHr();

  const query = ui.empSearch.trim().toLowerCase();
  const employees = data.employees.filter((employee) => {
    if (ui.empDept !== 'all' && employee.departmentId !== ui.empDept) return false;
    const statusMeta = getEmployeeStatusMeta(employee);
    if (ui.empStatus !== 'all' && statusMeta.key !== ui.empStatus) return false;
    if (!query) return true;
    const department = getDepartment(employee.departmentId);
    const haystack = [
      employee.name,
      employee.role,
      employee.city,
      employee.email,
      department?.name ?? '',
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(query);
  });

  return (
    <>
      <div className="toolbar">
        <div className="toolbar-filters">
          <input
            id="empSearchInput"
            type="search"
            className="input"
            style={{ width: 240 }}
            placeholder="Поиск по имени, роли, городу..."
            value={ui.empSearch}
            onChange={(event) => patchUi({ empSearch: event.target.value })}
          />
          <select
            id="empDeptFilter"
            className="select"
            value={ui.empDept}
            onChange={(event) => patchUi({ empDept: event.target.value })}
          >
            <option value="all">Все отделы</option>
            {data.departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </select>
          <select
            id="empStatusFilter"
            className="select"
            value={ui.empStatus}
            onChange={(event) => patchUi({ empStatus: event.target.value })}
          >
            <option value="all">Любой статус</option>
            <option value="active">В штате</option>
            <option value="probation">Испытательный</option>
            <option value="on_leave">В отпуске / отсутствует</option>
          </select>
        </div>
        <div className="segmented">
          <button
            className={`segmented-btn${ui.empLayout === 'table' ? ' active' : ''}`}
            type="button"
            onClick={() => patchUi({ empLayout: 'table' })}
          >
            Таблица
          </button>
          <button
            className={`segmented-btn${ui.empLayout === 'cards' ? ' active' : ''}`}
            type="button"
            onClick={() => patchUi({ empLayout: 'cards' })}
          >
            Карточки
          </button>
        </div>
      </div>

      {employees.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-title">Ничего не найдено</div>
            <div>Измените параметры поиска или фильтры</div>
          </div>
        </div>
      ) : ui.empLayout === 'cards' ? (
        <div className="cards-grid">
          {employees.map((employee) => {
            const department = getDepartment(employee.departmentId);
            const status = getEmployeeStatusMeta(employee);
            const balance = getVacationBalance(employee);
            return (
              <article
                className="employee-card"
                key={employee.id}
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
                  <Avatar employee={employee} />
                  <div className="person-meta">
                    <div className="person-name">{employee.name}</div>
                    <div className="person-sub">{employee.role}</div>
                  </div>
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <StatusText statusClass={status.statusClass} label={status.label} />
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {department?.name ?? '—'}
                  </span>
                </div>
                <div className="employee-card-meta">
                  <div className="meta-line">
                    <span>Локация</span>
                    <span>
                      {employee.format} · {employee.city}
                    </span>
                  </div>
                  <div className="meta-line">
                    <span>Отпуск</span>
                    <span className="tabular">
                      {balance.remaining} / {balance.total} дн.
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Сотрудник</th>
                  <th>Должность и руководитель</th>
                  <th>Отдел</th>
                  <th>Локация</th>
                  <th>Статус</th>
                  <th>Остаток отпуска</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((employee) => {
                  const department = getDepartment(employee.departmentId);
                  const status = getEmployeeStatusMeta(employee);
                  const balance = getVacationBalance(employee);
                  const manager = employee.managerId ? getEmployee(employee.managerId) : null;
                  return (
                    <tr
                      key={employee.id}
                      onClick={() => openDrawer(employee.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>
                        <div className="person-cell">
                          <Avatar employee={employee} />
                          <div className="person-meta">
                            <div className="person-name">{employee.name}</div>
                            <div className="person-sub">{employee.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div>{employee.role}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          {manager ? manager.name : 'Руководитель компании'}
                        </div>
                      </td>
                      <td>
                        <span
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}
                        >
                          <span
                            className="dept-dot"
                            style={{ background: department?.color ?? '#999' }}
                          />
                          {department?.name ?? '—'}
                        </span>
                      </td>
                      <td>
                        {employee.format} · {employee.city}{' '}
                        <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                          ({employee.timezone || 'МСК'})
                        </span>
                      </td>
                      <td>
                        <StatusText statusClass={status.statusClass} label={status.label} />
                      </td>
                      <td className="tabular" style={{ whiteSpace: 'nowrap' }}>
                        {balance.remaining}{' '}
                        <span style={{ color: 'var(--text-muted)' }}>/ {balance.total} дн.</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
