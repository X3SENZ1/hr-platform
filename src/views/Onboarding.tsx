import { useMemo, useState, type FormEvent } from 'react';
import { useHr } from '../state/HrContext';
import { formatDateFull } from '../lib/date';
import { LEAVE_PRIORITY_META, ONBOARDING_STAGES, OWNERS } from '../lib/meta';
import type { OnboardingTask } from '../types';
import { Avatar, EmptyState, ProgressBar, StatusBadge } from '../components/ui';
import { RadioGroup } from '../components/Filters';

function taskPriority(task: OnboardingTask) {
  return LEAVE_PRIORITY_META[task.priority ?? 'normal'];
}

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
  const [collapsedStages, setCollapsedStages] = useState<Record<string, boolean>>({});
  const [taskTitle, setTaskTitle] = useState('');
  const [taskError, setTaskError] = useState('');

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

  const allStages = useMemo(() => {
    if (!selectedTrack) return [];
    const extraStages = selectedTrack.tasks
      .map((task) => task.stage)
      .filter((stage, index, all) => !ONBOARDING_STAGES.includes(stage) && all.indexOf(stage) === index);
    return [...ONBOARDING_STAGES, ...extraStages];
  }, [selectedTrack]);

  const handleAddTask = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedTrack) return;
    const form = event.currentTarget;
    const formData = new FormData(form);
    const title = String(formData.get('title') || '').trim();
    if (title.length < 3) {
      setTaskError('Название задачи — минимум 3 символа.');
      document.getElementById('new-task-title')?.focus();
      return;
    }
    const stage = String(formData.get('stage') || 'Первая неделя');
    addTask(selectedTrack.id, stage, title, String(formData.get('owner') || 'HR'));
    setTaskTitle('');
    setTaskError('');
    setCollapsedStages((prev) => ({ ...prev, [stage]: false }));
  };

  return (
    <div className="onboarding-layout">
      <section className="card newcomers-panel" aria-labelledby="newcomers-title">
        <header className="card-header card-header-wrap">
          <div>
            <h2 className="card-title" id="newcomers-title">
              Новички
            </h2>
            <p className="card-subtitle" aria-live="polite">
              {filteredTracks.length} планов в категории
            </p>
          </div>
          <div className="segmented" role="group" aria-label="Фильтр планов">
            <button
              className={`segmented-btn${ui.onbFilter === 'active' ? ' active' : ''}`}
              type="button"
              aria-pressed={ui.onbFilter === 'active'}
              onClick={() => patchUi({ onbFilter: 'active', selectedOnbId: null })}
            >
              В работе · {activeCount}
            </button>
            <button
              className={`segmented-btn${ui.onbFilter === 'completed' ? ' active' : ''}`}
              type="button"
              aria-pressed={ui.onbFilter === 'completed'}
              onClick={() => patchUi({ onbFilter: 'completed', selectedOnbId: null })}
            >
              Готово · {completedCount}
            </button>
          </div>
        </header>
        {filteredTracks.length === 0 ? (
          <EmptyState
            title="Нет планов в этой категории"
            text="Переключите фильтр или запустите новый план онбординга."
          />
        ) : (
          <ul className="list newcomer-list">
            {filteredTracks.map((track) => {
              const employee = getEmployee(track.employeeId);
              if (!employee) return null;
              const progress = getOnboardingProgress(track);
              const isSelected = selectedTrack?.id === track.id;
              return (
                <li key={track.id}>
                  <button
                    className={`newcomer-card${isSelected ? ' active' : ''}`}
                    type="button"
                    aria-current={isSelected ? 'true' : undefined}
                    onClick={() => patchUi({ selectedOnbId: track.id })}
                  >
                    <span className="person-cell">
                      <Avatar employee={employee} />
                      <span className="person-meta">
                        <span className="person-name">{employee.name}</span>
                        <span className="person-sub">{employee.role}</span>
                      </span>
                    </span>
                    <span className="newcomer-progress">
                      <span className="progress-caption">
                        <span>
                          Старт{' '}
                          <time dateTime={track.startedAt}>{formatDateFull(track.startedAt)}</time>
                        </span>
                        <span className="tabular">{progress.percent}%</span>
                      </span>
                      <ProgressBar percent={progress.percent} label={`Прогресс ${employee.name}`} />
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {selectedTrack ? (
        (() => {
          const employee = getEmployee(selectedTrack.employeeId);
          const buddy = getEmployee(selectedTrack.buddyId);
          const department = employee ? getDepartment(employee.departmentId) : null;
          const progress = getOnboardingProgress(selectedTrack);
          const isCompleted = progress.percent === 100;

          return (
            <section className="card onboarding-detail" aria-labelledby="onboarding-detail-title">
              <header className="onboarding-detail-header">
                <div className="person-cell">
                  <Avatar employee={employee} size="lg" />
                  <div>
                    <p className="modal-eyebrow">План адаптации</p>
                    <h2 className="onboarding-person-name" id="onboarding-detail-title">
                      {employee?.name ?? 'Сотрудник'}
                    </h2>
                    <p className="person-sub">
                      {employee?.role ?? ''}
                      {department ? ` · ${department.name}` : ''}
                    </p>
                    <p className="onboarding-meta">
                      Выход{' '}
                      <time dateTime={selectedTrack.startedAt}>
                        {formatDateFull(selectedTrack.startedAt)}
                      </time>
                      {buddy ? (
                        <>
                          {' · Бадди: '}
                          <button
                            className="link-btn"
                            type="button"
                            onClick={() => openDrawer(buddy.id)}
                          >
                            {buddy.name}
                          </button>
                        </>
                      ) : null}
                    </p>
                    <p className="onboarding-meta">
                      <StatusBadge
                        statusClass={isCompleted ? 'status-active' : 'status-probation'}
                        label={isCompleted ? 'Завершён' : 'В работе'}
                      />
                    </p>
                  </div>
                </div>
                <div className="onboarding-progress">
                  <p className="progress-caption">
                    <span>Прогресс</span>
                    <strong className="tabular">
                      {progress.done} / {progress.total} · {progress.percent}%
                    </strong>
                  </p>
                  <ProgressBar percent={progress.percent} height={8} label="Общий прогресс плана" />
                  <p className="muted-text">{selectedTrack.notes}</p>
                </div>
              </header>

              <div className="owner-filter">
                <RadioGroup
                  legend="Ответственный"
                  options={OWNERS.map((owner) => ({
                    value: owner,
                    label: owner === 'all' ? 'Все' : owner,
                  }))}
                  value={ui.onbOwnerFilter}
                  onChange={(value) => patchUi({ onbOwnerFilter: value })}
                />
              </div>

              <div className="stages">
                {allStages.map((stageName, index) => {
                  const stageTasks = selectedTrack.tasks.filter((task) => task.stage === stageName);
                  const visibleTasks =
                    ui.onbOwnerFilter === 'all'
                      ? stageTasks
                      : stageTasks.filter((task) => task.owner === ui.onbOwnerFilter);
                  if (stageTasks.length === 0) return null;
                  const doneInStage = stageTasks.filter((task) => task.done).length;
                  const isCollapsed = Boolean(collapsedStages[stageName]);
                  const panelId = `stage-panel-${selectedTrack.id}-${index}`;
                  const buttonId = `stage-button-${selectedTrack.id}-${index}`;
                  return (
                    <section className="stage-group" key={stageName} aria-labelledby={buttonId}>
                      <h3 className="stage-heading">
                        <button
                          id={buttonId}
                          className="stage-toggle"
                          type="button"
                          aria-expanded={!isCollapsed}
                          aria-controls={panelId}
                          onClick={() =>
                            setCollapsedStages((prev) => ({
                              ...prev,
                              [stageName]: !prev[stageName],
                            }))
                          }
                        >
                          <span className="stage-title">{stageName}</span>
                          <span className="stage-count tabular">
                            {doneInStage} / {stageTasks.length}
                          </span>
                          <span
                            className={`accordion-icon${isCollapsed ? '' : ' open'}`}
                            aria-hidden="true"
                          >
                            ⌄
                          </span>
                        </button>
                      </h3>
                      <div
                        id={panelId}
                        className={`accordion-panel${isCollapsed ? '' : ' open'}`}
                        role="region"
                        aria-labelledby={buttonId}
                        inert={isCollapsed}
                      >
                        <div className="accordion-inner">
                          {visibleTasks.length === 0 ? (
                            <p className="muted-text stage-empty">
                              Нет задач для выбранного ответственного.
                            </p>
                          ) : (
                            <ul className="task-list">
                              {visibleTasks.map((task) => {
                                const priority = taskPriority(task);
                                return (
                                  <li key={task.id}>
                                    <label className={`task-control${task.done ? ' done' : ''}`}>
                                      <input
                                        type="checkbox"
                                        checked={task.done}
                                        onChange={(event) =>
                                          toggleTask(selectedTrack.id, task.id, event.target.checked)
                                        }
                                      />
                                      <span className="check-box" aria-hidden="true">
                                        <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                                          <path
                                            d="M2 6.2 4.6 8.8 10 3.4"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                          />
                                        </svg>
                                      </span>
                                      <span className="task-title">{task.title}</span>
                                      <span className={`task-priority ${priority.className}`}>
                                        <span aria-hidden="true">{priority.icon}</span>
                                        <span className="visually-hidden">
                                          Приоритет: {priority.label}
                                        </span>
                                      </span>
                                      <span className="owner-label">{task.owner}</span>
                                    </label>
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </div>
                      </div>
                    </section>
                  );
                })}
              </div>

              <form className="inline-add-task" onSubmit={handleAddTask} noValidate>
                <div className="form-field inline-task-title">
                  <label className="visually-hidden" htmlFor="new-task-title">
                    Название новой задачи
                  </label>
                  <input
                    id="new-task-title"
                    type="text"
                    name="title"
                    className="input"
                    placeholder="Новая задача в план…"
                    value={taskTitle}
                    aria-invalid={Boolean(taskError)}
                    aria-describedby={taskError ? 'new-task-error' : undefined}
                    onChange={(event) => {
                      setTaskTitle(event.target.value);
                      if (taskError) setTaskError('');
                    }}
                  />
                  {taskError ? (
                    <p className="field-error" id="new-task-error" role="alert">
                      {taskError}
                    </p>
                  ) : null}
                </div>
                <div className="form-field">
                  <label className="visually-hidden" htmlFor="new-task-stage">
                    Этап
                  </label>
                  <select id="new-task-stage" name="stage" className="select" defaultValue="Первая неделя">
                    <option value="День 1">День 1</option>
                    <option value="Первая неделя">Первая неделя</option>
                    <option value="Первый месяц">Первый месяц</option>
                  </select>
                </div>
                <div className="form-field">
                  <label className="visually-hidden" htmlFor="new-task-owner">
                    Ответственный
                  </label>
                  <select id="new-task-owner" name="owner" className="select" defaultValue="HR">
                    <option value="HR">HR</option>
                    <option value="Бадди">Бадди</option>
                    <option value="Тимлид">Тимлид</option>
                    <option value="Новичок">Новичок</option>
                  </select>
                </div>
                <button className="btn btn-primary" type="submit">
                  Добавить задачу
                </button>
              </form>
            </section>
          );
        })()
      ) : (
        <section className="card">
          <EmptyState
            title="Выберите сотрудника"
            text="Или запустите новый план адаптации, чтобы увидеть чек-лист."
          />
        </section>
      )}
    </div>
  );
}
