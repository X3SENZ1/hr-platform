import { useHr } from '../state/HrContext';
import type { Employee } from '../types';
import { Avatar } from '../components/ui';

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

  const toolbar = (
    <div className="toolbar">
      <input
        id="structureSearchInput"
        type="search"
        className="input"
        style={{ width: 240 }}
        placeholder="Найти на оргсхеме..."
        value={ui.structureSearch}
        onChange={(event) => patchUi({ structureSearch: event.target.value })}
      />
      <div className="segmented">
        <button
          className={`segmented-btn${ui.structureMode === 'tree' ? ' active' : ''}`}
          type="button"
          onClick={() => patchUi({ structureMode: 'tree' })}
        >
          Оргсхема
        </button>
        <button
          className={`segmented-btn${ui.structureMode === 'cards' ? ' active' : ''}`}
          type="button"
          onClick={() => patchUi({ structureMode: 'cards' })}
        >
          Отделы
        </button>
      </div>
    </div>
  );

  if (ui.structureMode === 'cards') {
    return (
      <>
        {toolbar}
        <div className="dept-cards-grid">
          {data.departments.map((department) => {
            const members = data.employees.filter(
              (employee) => employee.departmentId === department.id,
            );
            const lead = getEmployee(department.leadId);
            return (
              <section className="card" key={department.id}>
                <div className="card-body">
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 6,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontWeight: 600,
                        fontSize: 14.5,
                      }}
                    >
                      <span className="dept-dot" style={{ background: department.color }} />
                      {department.name}
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {members.length} чел.
                    </span>
                  </div>
                  <p
                    style={{
                      margin: '0 0 12px',
                      color: 'var(--text-secondary)',
                      fontSize: 12.5,
                    }}
                  >
                    {department.description}
                  </p>
                  {lead && (
                    <div style={{ marginBottom: 10 }}>
                      <button
                        className={`org-lead-btn${matchClass(lead)}`}
                        type="button"
                        onClick={() => openDrawer(lead.id)}
                      >
                        <Avatar employee={lead} size="sm" />
                        <div className="person-meta">
                          <div className="person-name">{lead.name}</div>
                          <div className="person-sub">{lead.role}</div>
                        </div>
                      </button>
                    </div>
                  )}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 2,
                      marginBottom: 12,
                    }}
                  >
                    {members
                      .filter((member) => !lead || member.id !== lead.id)
                      .map((member) => (
                        <button
                          className={`org-member-btn${matchClass(member)}`}
                          key={member.id}
                          type="button"
                          onClick={() => openDrawer(member.id)}
                        >
                          <Avatar employee={member} size="sm" />
                          <div className="person-meta">
                            <div className="person-name">{member.name}</div>
                            <div className="person-sub">{member.role}</div>
                          </div>
                        </button>
                      ))}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      paddingTop: 10,
                      borderTop: '1px solid var(--border)',
                      fontSize: 12,
                      color: 'var(--text-muted)',
                    }}
                  >
                    <span>Вакансий: {department.openRoles || 0}</span>
                    <button
                      className="link-btn"
                      type="button"
                      onClick={() => openDepartment(department.id)}
                    >
                      Открыть в базе →
                    </button>
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      </>
    );
  }

  const execDepartment = getDepartment('exec');
  const ceo = (execDepartment && getEmployee(execDepartment.leadId)) || data.employees[0];
  const execOthers = data.employees.filter(
    (employee) => employee.departmentId === 'exec' && (!ceo || employee.id !== ceo.id),
  );
  const branchDepartments = data.departments.filter((department) => department.id !== 'exec');

  return (
    <>
      {toolbar}
      <div className="org-tree-scroll">
        <div className="org-tree">
          {ceo && (
            <>
              <div
                className={`org-ceo-node${matchClass(ceo)}`}
                role="button"
                tabIndex={0}
                onClick={() => openDrawer(ceo.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    openDrawer(ceo.id);
                  }
                }}
              >
                <Avatar employee={ceo} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{ceo.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{ceo.role}</div>
                </div>
              </div>
              {execOthers.length > 0 && (
                <div
                  style={{
                    display: 'flex',
                    gap: 8,
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    marginTop: 8,
                  }}
                >
                  {execOthers.map((member) => (
                    <button
                      className={`btn btn-sm btn-secondary${matchClass(member)}`}
                      key={member.id}
                      type="button"
                      onClick={() => openDrawer(member.id)}
                    >
                      {member.name}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
          <div className="org-stem-down" />
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
                <div className="org-branch-col" key={department.id}>
                  <div className="org-dept-box">
                    <div className="org-dept-head">
                      <div className="org-dept-title-row">
                        <div className="org-dept-name">
                          <span
                            className="dept-dot"
                            style={{ background: department.color }}
                          />
                          {department.name}
                        </div>
                        <span
                          className="tabular"
                          style={{ fontSize: 12, color: 'var(--text-muted)' }}
                        >
                          {members.length}
                          {department.openRoles ? ` · +${department.openRoles} вак.` : ''}
                        </span>
                      </div>
                      {lead && (
                        <button
                          className={`org-lead-btn${matchClass(lead)}`}
                          type="button"
                          onClick={() => openDrawer(lead.id)}
                        >
                          <Avatar employee={lead} size="sm" />
                          <div className="person-meta">
                            <div className="person-name">{lead.name}</div>
                            <div className="person-sub">{lead.role}</div>
                          </div>
                        </button>
                      )}
                    </div>
                    <div className="org-members-list">
                      {others.length ? (
                        others.map((member) => {
                          const status = getEmployeeStatusMeta(member);
                          return (
                            <button
                              className={`org-member-btn${matchClass(member)}`}
                              key={member.id}
                              type="button"
                              onClick={() => openDrawer(member.id)}
                            >
                              <Avatar employee={member} size="sm" />
                              <div className="person-meta">
                                <div className="person-name">{member.name}</div>
                                <div className="person-sub">
                                  {member.role}
                                  {status.key === 'probation' ? ' · исп.' : ''}
                                </div>
                              </div>
                            </button>
                          );
                        })
                      ) : (
                        <div
                          style={{
                            padding: 10,
                            fontSize: 12,
                            color: 'var(--text-muted)',
                            textAlign: 'center',
                          }}
                        >
                          Нет участников
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
