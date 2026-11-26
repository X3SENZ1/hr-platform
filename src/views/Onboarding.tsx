import type { FormEvent } from 'react';
import { useHr } from '../state/HrContext';
import { formatDateFull } from '../lib/date';
import { ONBOARDING_STAGES, OWNERS } from '../lib/meta';
import { Avatar, ProgressBar } from '../components/ui';

export function Onboarding() {
  const {
    data,
    ui,
    patchUi,
    getEmployee,
    getDepartment,
    getOnboardingProgress,
    toggleTask,
    addTask,
    openDrawer,
  } = useHr();

  const filteredTracks = data.onboarding.filter((track) => {
    const progress = getOnboardingProgress(track);
    return ui.onbFilter === 'completed' ? progress.percent === 100 : progress.percent < 100;
  });

  const selectedTrack =
    filteredTracks.find((track) => track.id === ui.selectedOnbId) ?? filteredTracks[0] ?? null;

  const activeCount = data.onboarding.filter(
    (track) => getOnboardingProgress(track).percent < 100,
  ).length;
  const completedCount = data.onboarding.length - activeCount;

  const listContent =
    filteredTracks.length === 0 ? (
      <div className="empty-state">Нет планов в этой категории</div>
    ) : (
      filteredTracks.map((track) => {
        const employee = getEmployee(track.employeeId);
        if (!employee) return null;
        const progress = getOnboardingProgress(track);
        const isSelected = selectedTrack?.id === track.id;
        return (
          <div
            className={`newcomer-card${isSelected ? ' active' : ''}`}
            key={track.id}
            role="button"
            tabIndex={0}
            onClick={() => patchUi({ selectedOnbId: track.id })}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                patchUi({ selectedOnbId: track.id });
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
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 12,
                  color: 'var(--text-muted)',
                  marginBottom: 5,
                }}
              >
                <span>Старт {formatDateFull(track.startedAt)}</span>
                <span
                  className="tabular"
                  style={{ color: 'var(--text)', fontWeight: 500 }}
                >
                  {progress.percent}%
                </span>
              </div>
              <ProgressBar percent={progress.percent} />
            </div>
          </div>
        );
      })
    );

  let detailContent = (
    <div className="card">
      <div className="empty-state">
        <div className="empty-state-title">Выберите сотрудника</div>
        <div>Или запустите новый план адаптации</div>
      </div>
    </div>
  );

  if (selectedTrack) {
    const employee = getEmployee(selectedTrack.employeeId);
    const buddy = getEmployee(selectedTrack.buddyId);
    const department = employee ? getDepartment(employee.departmentId) : null;
    const progress = getOnboardingProgress(selectedTrack);

    const extraStages = selectedTrack.tasks
      .map((task) => task.stage)
      .filter((stage, index, all) => !ONBOARDING_STAGES.includes(stage) && all.indexOf(stage) === index);
    const allStages = [...ONBOARDING_STAGES, ...extraStages];

    const stagesContent = allStages.map((stageName) => {
      const stageTasks = selectedTrack.tasks.filter((task) => task.stage === stageName);
      const visibleTasks =
        ui.onbOwnerFilter === 'all'
          ? stageTasks
          : stageTasks.filter((task) => task.owner === ui.onbOwnerFilter);
      if (visibleTasks.length === 0) return null;
      const doneInStage = stageTasks.filter((task) => task.done).length;

      return (
        <div className="stage-group" key={stageName}>
          <div className="stage-header">
            <span className="stage-title">{stageName}</span>
            <span className="tabular" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {doneInStage} / {stageTasks.length}
            </span>
          </div>
          {visibleTasks.map((task) => (
            <label className={`checklist-item${task.done ? ' done' : ''}`} key={task.id}>
              <input
                type="checkbox"
                className="checklist-checkbox"
                checked={task.done}
                onChange={(event) =>
                  toggleTask(selectedTrack.id, task.id, event.target.checked)
                }
              />
              <span className="checklist-label">{task.title}</span>
              <span className="owner-label">{task.owner}</span>
            </label>
          ))}
        </div>
      );
    });

    const handleAddTask = (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const form = event.currentTarget;
      const formData = new FormData(form);
      const title = String(formData.get('title') || '').trim();
      if (!title) return;
      addTask(
        selectedTrack.id,
        String(formData.get('stage') || 'Первая неделя'),
        title,
        String(formData.get('owner') || 'HR'),
      );
      form.reset();
    };

    detailContent = (
      <section className="card">
        <div className="card-body">
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 14,
            }}
          >
            <div
              className="person-cell"
              style={{ cursor: 'pointer' }}
              role="button"
              tabIndex={0}
              onClick={() => employee && openDrawer(employee.id)}
              onKeyDown={(event) => {
                if (employee && (event.key === 'Enter' || event.key === ' ')) {
                  event.preventDefault();
                  openDrawer(employee.id);
                }
              }}
            >
              <Avatar employee={employee} size="lg" />
              <div>
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
                  {employee?.name ?? 'Сотрудник'}
                </h2>
                <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                  {employee?.role ?? ''}
                  {department ? ` · ${department.name}` : ''}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  Выход {formatDateFull(selectedTrack.startedAt)}
                  {buddy ? (
                    <>
                      {' · Бадди: '}
                      <button
                        className="link-btn"
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          openDrawer(buddy.id);
                        }}
                      >
                        {buddy.name}
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
            </div>
            <div style={{ minWidth: 165 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 12.5,
                  marginBottom: 6,
                }}
              >
                <span>Прогресс</span>
                <strong className="tabular">
                  {progress.done} / {progress.total}
                </strong>
              </div>
              <ProgressBar percent={progress.percent} height={6} />
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 10,
            padding: '11px 18px',
            borderTop: '1px solid var(--border)',
            background: 'var(--surface-subtle)',
          }}
        >
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Ответственный</span>
          <div className="segmented">
            {OWNERS.map((owner) => (
              <button
                className={`segmented-btn${ui.onbOwnerFilter === owner ? ' active' : ''}`}
                key={owner}
                type="button"
                onClick={() => patchUi({ onbOwnerFilter: owner })}
              >
                {owner === 'all' ? 'Все' : owner}
              </button>
            ))}
          </div>
        </div>

        {stagesContent.some(Boolean) ? (
          <>{stagesContent}</>
        ) : (
          <div className="empty-state">Нет задач для выбранной роли</div>
        )}

        <form className="inline-add-task" onSubmit={handleAddTask}>
          <input
            type="text"
            name="title"
            className="input"
            placeholder="Новая задача в план..."
            required
          />
          <select name="stage" className="select" defaultValue="Первая неделя">
            <option value="День 1">День 1</option>
            <option value="Первая неделя">Первая неделя</option>
            <option value="Первый месяц">Первый месяц</option>
          </select>
          <select name="owner" className="select" defaultValue="HR">
            <option value="HR">HR</option>
            <option value="Бадди">Бадди</option>
            <option value="Тимлид">Тимлид</option>
            <option value="Новичок">Новичок</option>
          </select>
          <button className="btn btn-primary" type="submit">
            Добавить
          </button>
        </form>
      </section>
    );
  }

  return (
    <div className="onboarding-layout">
      <section className="card">
        <div className="card-header" style={{ flexWrap: 'wrap' }}>
          <h2 className="card-title">Новички</h2>
          <div className="segmented">
            <button
              className={`segmented-btn${ui.onbFilter === 'active' ? ' active' : ''}`}
              type="button"
              onClick={() => patchUi({ onbFilter: 'active', selectedOnbId: null })}
            >
              В работе · {activeCount}
            </button>
            <button
              className={`segmented-btn${ui.onbFilter === 'completed' ? ' active' : ''}`}
              type="button"
              onClick={() => patchUi({ onbFilter: 'completed', selectedOnbId: null })}
            >
              Готово · {completedCount}
            </button>
          </div>
        </div>
        <div>{listContent}</div>
      </section>
      {detailContent}
    </div>
  );
}
