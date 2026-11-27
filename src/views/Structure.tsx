import { useHr } from '../state/HrContext';
import { formatDateFull } from '../lib/date';
import type { Employee } from '../types';
import { Avatar, EmptyState } from '../components/ui';
import { RadioGroup, SearchField } from '../components/Filters';

export function Structure() {
  const {
    data,
    ui,
    patchUi,
    getEmployee,
    getDepartment,
    getEmployeeStatusMeta,
    openDrawer,
    openDepartment,
  } = useHr();

  const query = ui.structureSearch.trim().toLowerCase();

  const matchClass = (employee: Employee | null): string => {
    if (!query || !employee) return '';
    return `${employee.name} ${employee.role}`.toLowerCase().includes(query)
      ? ' org-highlight'
      : ' org-dim';
  };

  const matches = data.employees.filter((employee) =>
    `${employee.name} ${employee.role}`.toLowerCase().includes(query),
  );

  const toolbar = (
    <section className="structure-toolbar" aria-labelledby="structure-toolbar-title">
      <h2 id="structure-toolbar-title" className="visually-hidden">
        Настройки оргсхемы
      </h2>
      <SearchField
        id="structureSearchInput"
        label="Поиск по оргсхеме"
        placeholder="Найти сотрудника или роль…"
        value={ui.structureSearch}
        onChange={(value) => patchUi({ structureSearch: value })}
      />
      <RadioGroup
        legend="Вид структуры"
        options={[
          { value: 'tree', label: 'Оргсхема' },
          { value: 'cards', label: 'Отделы' },
        ]}
        value={ui.structureMode}
        onChange={(value) => patchUi({ structureMode: value })}
      />
      <p className="filter-summary" aria-live="polite">
        {query ? `Совпадений: ${matches.length}` : `Сотрудников: ${data.employees.length}`}
      </p>
    </section>
  );

  if (ui.structureMode === 'cards') {
    return (
      <div className="stack">
        {toolbar}
        <div className="dept-cards-grid">
          {data.departments.map((department) => {
            const members = data.employees.filter(
              (employee) => employee.departmentId === department.id,
            );
            const lead = getEmployee(department.leadId);
            return (
              <article className="card dept-card" key={department.id}>
                <header className="dept-card-header">
                  <span className="entity-id">{department.code}</span>
                  <h2 className="entity-title">{department.name}</h2>
                  <span className="section-chip">{members.length} чел.</span>
                </header>
                <p className="entity-description">{department.description}</p>
                <div className="dept-goals">
                  <h3 className="meta-label">Цели отдела</h3>
                  <ul className="goal-list">
                    {department.goals.map((goal) => (
                      <li key={goal}>{goal}</li>
                    ))}
                  </ul>
                </div>
                {lead ? (
                  <div className="dept-lead">
                    <h3 className="meta-label">Руководитель</h3>
                    <button
                      className={`org-lead-btn${matchClass(lead)}`}
                      type="button"
                      onClick={() => openDrawer(lead.id)}
                    >
                      <Avatar employee={lead} size="sm" />
                      <span className="person-meta">
                        <span className="person-name">{lead.name}</span>
                        <span className="person-sub">{lead.role}</span>
                      </span>
                    </button>
                  </div>
                ) : null}
                <div className="dept-members">
                  <h3 className="meta-label">Команда</h3>
                  <ul className="member-list">
                    {members
                      .filter((member) => !lead || member.id !== lead.id)
                      .map((member) => (
                        <li key={member.id}>
                          <button
                            className={`org-member-btn${matchClass(member)}`}
                            type="button"
                            onClick={() => openDrawer(member.id)}
                          >
                            <Avatar employee={member} size="sm" />
                            <span className="person-meta">
                              <span className="person-name">{member.name}</span>
                              <span className="person-sub">{member.role}</span>
                            </span>
                          </button>
                        </li>
                      ))}
                  </ul>
                </div>
                <footer className="dept-card-footer">
                  <span>Вакансий: {department.openRoles || 0}</span>
                  <span>
                    Создан <time dateTime={department.createdAt}>{formatDateFull(department.createdAt)}</time>
                  </span>
                  <button
                    className="link-btn"
                    type="button"
                    onClick={() => openDepartment(department.id)}
                  >
                    Открыть в базе →
                  </button>
                </footer>
              </article>
            );
          })}
        </div>
      </div>
    );
  }

  const execDepartment = getDepartment('exec');
  const ceo = (execDepartment && getEmployee(execDepartment.leadId)) || data.employees[0];
  const execOthers = data.employees.filter(
    (employee) => employee.departmentId === 'exec' && (!ceo || employee.id !== ceo.id),
  );
  const branchDepartments = data.departments.filter((department) => department.id !== 'exec');

  return (
    <div className="stack">
      {toolbar}
      {query && matches.length === 0 ? (
        <div className="card">
          <EmptyState
            title="Никого не нашли"
            text="Попробуйте изменить запрос — поиск работает по имени и роли."
          />
        </div>
      ) : (
        <figure className="org-figure">
          <figcaption className="visually-hidden">
            Организационная схема компании «Аврора Тех»
          </figcaption>
          <div className="org-tree-scroll">
            <div className="org-tree">
              {ceo ? (
                <>
                  <button
                    className={`org-ceo-node${matchClass(ceo)}`}
                    type="button"
                    onClick={() => openDrawer(ceo.id)}
                  >
                    <Avatar employee={ceo} />
                    <span className="person-meta">
                      <span className="person-name">{ceo.name}</span>
                      <span className="person-sub">{ceo.role}</span>
                    </span>
                  </button>
                  {execOthers.length > 0 ? (
                    <ul className="exec-list">
                      {execOthers.map((member) => (
                        <li key={member.id}>
                          <button
                            className={`btn btn-sm btn-secondary${matchClass(member)}`}
                            type="button"
                            onClick={() => openDrawer(member.id)}
                          >
                            {member.name}
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </>
              ) : null}
              <span className="org-stem-down" aria-hidden="true" />
              <div
                className="org-branches"
                style={{ gridTemplateColumns: `repeat(${branchDepartments.length}, minmax(215px, 1fr))` }}
              >
                {branchDepartments.map((department) => {
                  const members = data.employees.filter(
                    (employee) => employee.departmentId === department.id,
                  );
                  const lead = getEmployee(department.leadId);
                  const others = members.filter((member) => !lead || member.id !== lead.id);
                  return (
                    <article className="org-branch-col" key={department.id}>
                      <div className="org-dept-box">
                        <header className="org-dept-head">
                          <div className="org-dept-title-row">
                            <h2 className="org-dept-name">
                              <span
                                className="dept-dot"
                                style={{ background: department.color }}
                                aria-hidden="true"
                              />
                              {department.name}
                            </h2>
                            <span className="tabular org-dept-count">
                              {members.length}
                              {department.openRoles ? ` · +${department.openRoles} вак.` : ''}
                            </span>
                          </div>
                          {lead ? (
                            <button
                              className={`org-lead-btn${matchClass(lead)}`}
                              type="button"
                              onClick={() => openDrawer(lead.id)}
                            >
                              <Avatar employee={lead} size="sm" />
                              <span className="person-meta">
                                <span className="person-name">{lead.name}</span>
                                <span className="person-sub">{lead.role}</span>
                              </span>
                            </button>
                          ) : null}
                        </header>
                        <div className="org-members-list">
                          {others.length ? (
                            <ul className="member-list">
                              {others.map((member) => {
                                const status = getEmployeeStatusMeta(member);
                                return (
                                  <li key={member.id}>
                                    <button
                                      className={`org-member-btn${matchClass(member)}`}
                                      type="button"
                                      onClick={() => openDrawer(member.id)}
                                    >
                                      <Avatar employee={member} size="sm" />
                                      <span className="person-meta">
                                        <span className="person-name">{member.name}</span>
                                        <span className="person-sub">
                                          {member.role}
                                          {status.key === 'probation' ? ' · исп.' : ''}
                                        </span>
                                      </span>
                                    </button>
                                  </li>
                                );
                              })}
                            </ul>
                          ) : (
                            <p className="muted-text org-empty">Нет участников</p>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
        </figure>
      )}
    </div>
  );
}
