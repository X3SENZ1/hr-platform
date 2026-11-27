import { useMemo, type MouseEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useHr } from '../state/HrContext';
import { formatDateFull } from '../lib/date';
import { EMPLOYEES_PAGE_SIZE, EMPLOYEE_STATUS_FILTERS } from '../lib/meta';
import type { EmployeeSortKey, EmployeeStatusFilter, SortDirection } from '../types';
import { CheckboxGroup, CustomSelect, RadioGroup, SearchField } from '../components/Filters';
import { Avatar, EmptyState, StatusBadge, TagList } from '../components/ui';

const DEFAULT_STATUSES: EmployeeStatusFilter[] = ['active', 'probation', 'on_leave'];

function entityId(id: string): string {
  return `EMP-${id.replace(/\D/g, '').padStart(3, '0')}`;
}

function pageList(current: number, total: number): Array<number | 'gap'> {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);
  const pages = new Set<number>([1, total, current - 1, current, current + 1]);
  const sorted = Array.from(pages)
    .filter((page) => page >= 1 && page <= total)
    .sort((a, b) => a - b);
  const result: Array<number | 'gap'> = [];
  sorted.forEach((page, index) => {
    if (index > 0 && page - sorted[index - 1] > 1) result.push('gap');
    result.push(page);
  });
  return result;
}

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
  const [searchParams, setSearchParams] = useSearchParams();

  const resetPageParam = () => {
    if (!searchParams.has('page')) return;
    const next = new URLSearchParams(searchParams);
    next.delete('page');
    setSearchParams(next, { replace: true });
  };

  const query = ui.empSearch.trim().toLowerCase();

  const filtered = useMemo(() => {
    return data.employees.filter((employee) => {
      if (ui.empDept !== 'all' && employee.departmentId !== ui.empDept) return false;
      const statusMeta = getEmployeeStatusMeta(employee);
      if (!ui.empStatuses.includes(statusMeta.key)) return false;
      if (!query) return true;
      const department = getDepartment(employee.departmentId);
      const haystack = [
        employee.name,
        employee.role,
        employee.city,
        employee.email,
        employee.telegram,
        department?.name ?? '',
        ...(employee.skills ?? []),
        ...(employee.tags ?? []),
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [
    data.employees,
    getDepartment,
    getEmployeeStatusMeta,
    query,
    ui.empDept,
    ui.empStatuses,
  ]);

  const sorted = useMemo(() => {
    const collator = new Intl.Collator('ru', { sensitivity: 'base' });
    const direction = ui.empSortDir === 'asc' ? 1 : -1;
    const value = (employee: (typeof data.employees)[number]): string | number => {
      switch (ui.empSortKey) {
        case 'role':
          return employee.role;
        case 'department':
          return getDepartment(employee.departmentId)?.name ?? '';
        case 'city':
          return employee.city;
        case 'status':
          return getEmployeeStatusMeta(employee).label;
        case 'vacation':
          return getVacationBalance(employee).remaining;
        case 'name':
        default:
          return employee.name;
      }
    };
    return filtered.slice().sort((a, b) => {
      const left = value(a);
      const right = value(b);
      if (typeof left === 'number' && typeof right === 'number') {
        return (left - right) * direction;
      }
      return collator.compare(String(left), String(right)) * direction;
    });
  }, [
    filtered,
    getDepartment,
    getEmployeeStatusMeta,
    getVacationBalance,
    ui.empSortDir,
    ui.empSortKey,
  ]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / EMPLOYEES_PAGE_SIZE));
  const rawPage = Number(searchParams.get('page') ?? '1');
  const page = Math.min(
    Math.max(1, Number.isFinite(rawPage) ? Math.trunc(rawPage) : 1),
    totalPages,
  );
  const start = (page - 1) * EMPLOYEES_PAGE_SIZE;
  const pageItems = sorted.slice(start, start + EMPLOYEES_PAGE_SIZE);

  const setPage = (next: number) => {
    const safe = Math.min(Math.max(1, next), totalPages);
    const params = new URLSearchParams(searchParams);
    if (safe <= 1) params.delete('page');
    else params.set('page', String(safe));
    setSearchParams(params);
  };

  const toggleStatus = (status: EmployeeStatusFilter) => {
    const next = ui.empStatuses.includes(status)
      ? ui.empStatuses.filter((item) => item !== status)
      : [...ui.empStatuses, status];
    patchUi({ empStatuses: next });
    resetPageParam();
  };

  const toggleSort = (key: EmployeeSortKey) => {
    if (ui.empSortKey === key) {
      patchUi({ empSortDir: (ui.empSortDir === 'asc' ? 'desc' : 'asc') as SortDirection });
    } else {
      patchUi({ empSortKey: key, empSortDir: 'asc' });
    }
  };

  const resetFilters = () => {
    patchUi({
      empSearch: '',
      empDept: 'all',
      empStatuses: DEFAULT_STATUSES,
      empLayout: 'table',
      empSortKey: 'name',
      empSortDir: 'asc',
    });
    resetPageParam();
  };

  const sortHeader = (key: EmployeeSortKey, label: string) => {
    const active = ui.empSortKey === key;
    const ariaSort: 'ascending' | 'descending' | 'none' = active
      ? ui.empSortDir === 'asc'
        ? 'ascending'
        : 'descending'
      : 'none';
    return (
      <th scope="col" aria-sort={ariaSort}>
        <button className="sort-btn" type="button" onClick={() => toggleSort(key)}>
          {label}
          <span className={`sort-indicator${active ? ' active' : ''}`} aria-hidden="true">
            {active ? (ui.empSortDir === 'asc' ? '↑' : '↓') : '↕'}
          </span>
        </button>
      </th>
    );
  };

  const handleTableClick = (event: MouseEvent<HTMLTableSectionElement>) => {
    const target = (event.target as HTMLElement).closest<HTMLElement>('[data-employee-id]');
    if (target?.dataset.employeeId) openDrawer(target.dataset.employeeId);
  };

  const handleCardsClick = (event: MouseEvent<HTMLDivElement>) => {
    const target = (event.target as HTMLElement).closest<HTMLElement>('[data-employee-id]');
    if (target?.dataset.employeeId) openDrawer(target.dataset.employeeId);
  };

  return (
    <div className="employees-layout">
      <section className="filters-panel" aria-labelledby="employees-filters-title">
        <header className="filters-header">
          <h2 id="employees-filters-title" className="section-title">
            Фильтры
          </h2>
          <button className="btn btn-sm btn-ghost" type="button" onClick={resetFilters}>
            Сбросить
          </button>
        </header>
        <form className="filters-form" onSubmit={(event) => event.preventDefault()}>
          <SearchField
            id="empSearchInput"
            label="Поиск"
            placeholder="Имя, роль, город, навык…"
            value={ui.empSearch}
            onChange={(value) => {
              patchUi({ empSearch: value });
              resetPageParam();
            }}
          />
          <CustomSelect
            id="empDeptFilter"
            label="Отдел"
            value={ui.empDept}
            options={[
              { value: 'all', label: 'Все отделы' },
              ...data.departments.map((department) => ({
                value: department.id,
                label: department.name,
              })),
            ]}
            onChange={(value) => {
              patchUi({ empDept: value });
              resetPageParam();
            }}
          />
          <CheckboxGroup
            legend="Статус"
            options={EMPLOYEE_STATUS_FILTERS}
            selected={ui.empStatuses}
            onToggle={toggleStatus}
          />
          <RadioGroup
            legend="Вид списка"
            options={[
              { value: 'table', label: 'Таблица' },
              { value: 'cards', label: 'Карточки' },
            ]}
            value={ui.empLayout}
            onChange={(value) => patchUi({ empLayout: value })}
          />
          <p className="filter-summary" aria-live="polite">
            Найдено: <strong>{sorted.length}</strong> из {data.employees.length}
          </p>
        </form>
      </section>

      <section className="content-panel" aria-labelledby="employees-list-title">
        <header className="section-heading">
          <div>
            <h2 id="employees-list-title" className="section-title">
              Команда «Аврора Тех»
            </h2>
            <p className="section-subtitle">
              Данные обновляются автоматически · {sorted.length} записей
            </p>
          </div>
          <span className="section-chip">{ui.empLayout === 'table' ? 'Таблица' : 'Карточки'}</span>
        </header>

        {sorted.length === 0 ? (
          <div className="card">
            <EmptyState
              title="Ничего не найдено"
              text="Измените запрос или сбросьте фильтры — в базе точно есть подходящие люди."
              action={
                <button className="btn btn-secondary" type="button" onClick={resetFilters}>
                  Сбросить фильтры
                </button>
              }
            />
          </div>
        ) : ui.empLayout === 'cards' ? (
          <div className="cards-grid" onClick={handleCardsClick}>
            {pageItems.map((employee) => {
              const department = getDepartment(employee.departmentId);
              const status = getEmployeeStatusMeta(employee);
              const balance = getVacationBalance(employee);
              const manager = employee.managerId ? getEmployee(employee.managerId) : null;
              return (
                <article
                  className="employee-card"
                  key={employee.id}
                  data-employee-id={employee.id}
                  tabIndex={0}
                  role="button"
                  aria-label={`Открыть профиль: ${employee.name}`}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      openDrawer(employee.id);
                    }
                  }}
                >
                  <header className="entity-card-header">
                    <span className="entity-id">{entityId(employee.id)}</span>
                    <h3 className="entity-title">{employee.name}</h3>
                    <StatusBadge statusClass={status.statusClass} label={status.label} />
                  </header>
                  <p className="entity-description">
                    {employee.bio || `${employee.role} в отделе «${department?.name ?? '—'}».`}
                  </p>
                  <dl className="entity-fields">
                    <div>
                      <dt>Должность</dt>
                      <dd>{employee.role}</dd>
                    </div>
                    <div>
                      <dt>Отдел</dt>
                      <dd>{department?.name ?? '—'}</dd>
                    </div>
                    <div>
                      <dt>Локация</dt>
                      <dd>
                        {employee.format} · {employee.city}
                      </dd>
                    </div>
                    <div>
                      <dt>Отпуск</dt>
                      <dd className="tabular">
                        {balance.remaining} / {balance.total} дн.
                      </dd>
                    </div>
                  </dl>
                  <footer className="entity-meta">
                    <span>
                      <span className="meta-label">С</span>{' '}
                      <time dateTime={employee.startDate}>{formatDateFull(employee.startDate)}</time>
                    </span>
                    <span>
                      <span className="meta-label">Рук.</span>{' '}
                      {manager?.name ?? 'Руководитель компании'}
                    </span>
                    <TagList tags={employee.tags} label={`Теги: ${employee.name}`} />
                  </footer>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="card table-card">
            <div className="table-wrap">
              <table className="data-table employees-table">
                <caption>
                  Сотрудники компании «Аврора Тех» — страница {page} из {totalPages}
                </caption>
                <thead>
                  <tr>
                    {sortHeader('name', 'Сотрудник')}
                    {sortHeader('role', 'Должность и руководитель')}
                    {sortHeader('department', 'Отдел')}
                    {sortHeader('city', 'Локация')}
                    {sortHeader('status', 'Статус')}
                    {sortHeader('vacation', 'Остаток отпуска')}
                  </tr>
                </thead>
                <tbody onClick={handleTableClick}>
                  {pageItems.map((employee) => {
                    const department = getDepartment(employee.departmentId);
                    const status = getEmployeeStatusMeta(employee);
                    const balance = getVacationBalance(employee);
                    const manager = employee.managerId ? getEmployee(employee.managerId) : null;
                    return (
                      <tr key={employee.id} data-employee-id={employee.id}>
                        <th scope="row" data-label="Сотрудник">
                          <span className="person-cell">
                            <Avatar employee={employee} />
                            <span className="person-meta">
                              <span className="person-name">{employee.name}</span>
                              <span className="person-sub">{employee.email}</span>
                            </span>
                          </span>
                        </th>
                        <td data-label="Должность">
                          <span className="cell-primary">{employee.role}</span>
                          <span className="cell-secondary">
                            {manager ? manager.name : 'Руководитель компании'}
                          </span>
                        </td>
                        <td data-label="Отдел">
                          <span className="dept-cell">
                            <span
                              className="dept-dot"
                              style={{ background: department?.color ?? 'var(--text-muted)' }}
                              aria-hidden="true"
                            />
                            {department?.name ?? '—'}
                          </span>
                        </td>
                        <td data-label="Локация">
                          {employee.format} · {employee.city}{' '}
                          <span className="cell-secondary">({employee.timezone || 'МСК'})</span>
                        </td>
                        <td data-label="Статус">
                          <StatusBadge statusClass={status.statusClass} label={status.label} />
                        </td>
                        <td data-label="Остаток отпуска" className="tabular">
                          {balance.remaining}{' '}
                          <span className="cell-secondary">/ {balance.total} дн.</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {sorted.length > 0 ? (
          <nav className="pagination" aria-label="Страницы списка сотрудников">
            <button
              className="pagination-btn"
              type="button"
              onClick={() => setPage(page - 1)}
              disabled={page <= 1}
              aria-label="Предыдущая страница"
            >
              ← <span className="pagination-text">Назад</span>
            </button>
            <ol className="pagination-list">
              {pageList(page, totalPages).map((item, index) =>
                item === 'gap' ? (
                  <li className="pagination-gap" key={`gap-${index}`} aria-hidden="true">
                    …
                  </li>
                ) : (
                  <li key={item}>
                    <button
                      className={`pagination-btn${item === page ? ' active' : ''}`}
                      type="button"
                      aria-current={item === page ? 'page' : undefined}
                      aria-label={`Страница ${item}`}
                      onClick={() => setPage(item)}
                    >
                      {item}
                    </button>
                  </li>
                ),
              )}
            </ol>
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
        ) : null}
      </section>
    </div>
  );
}
