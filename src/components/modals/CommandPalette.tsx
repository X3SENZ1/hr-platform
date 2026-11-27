import { useEffect, useMemo, useState, type KeyboardEvent } from 'react';
import { useHr } from '../../state/HrContext';
import { Avatar } from '../ui';
import { IconSearch } from '../icons';
import { ModalShell } from './ModalShell';

interface CommandItem {
  key: string;
  label: string;
  hint: string;
  employeeId?: string;
  run: () => void;
}

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
  const [activeIndex, setActiveIndex] = useState(0);

  const query = ui.commandQuery.trim().toLowerCase();

  const items = useMemo<CommandItem[]>(() => {
    const actions: CommandItem[] = [
      {
        key: 'action-employee',
        label: 'Добавить сотрудника',
        hint: 'Штат',
        run: () => openModal('addEmployee'),
      },
      {
        key: 'action-leave',
        label: 'Оформить отпуск / отгул',
        hint: 'Отпуска',
        run: () => openModal('addLeave'),
      },
      {
        key: 'action-structure',
        label: 'Открыть оргсхему',
        hint: 'Структура',
        run: () => {
          closeModal();
          goTo('structure');
        },
      },
      {
        key: 'action-onboarding',
        label: 'Перейти к онбордингу',
        hint: 'Онбординг',
        run: () => {
          closeModal();
          goTo('onboarding');
        },
      },
    ].filter((action) => !query || action.label.toLowerCase().includes(query));

    const employees: CommandItem[] = data.employees
      .filter((employee) => {
        if (!query) return true;
        return `${employee.name} ${employee.role} ${employee.city}`
          .toLowerCase()
          .includes(query);
      })
      .slice(0, 6)
      .map((employee) => ({
        key: `employee-${employee.id}`,
        label: employee.name,
        hint: `${employee.role}${getDepartment(employee.departmentId) ? ` · ${getDepartment(employee.departmentId)?.name}` : ''}`,
        employeeId: employee.id,
        run: () => {
          closeModal();
          openDrawer(employee.id);
        },
      }));

    return [...employees, ...actions];
  }, [closeModal, data.employees, getDepartment, goTo, openModal, query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % Math.max(1, items.length));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => (index - 1 + items.length) % Math.max(1, items.length));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      items[activeIndex]?.run();
    } else if (event.key === 'Escape') {
      closeModal();
    }
  };

  return (
    <ModalShell id="commandModal" labelledBy="commandTitle" className="command-modal">
      <h2 id="commandTitle" className="visually-hidden">
        Быстрый поиск по платформе
      </h2>
      <div className="command-input-wrap">
        <IconSearch />
        <input
          id="commandInput"
          type="text"
          role="combobox"
          aria-expanded="true"
          aria-controls="commandResults"
          aria-autocomplete="list"
          placeholder="Найти сотрудника или действие…"
          autoComplete="off"
          value={ui.commandQuery}
          onChange={(event) => patchUi({ commandQuery: event.target.value })}
          onKeyDown={handleKeyDown}
        />
        <button className="kbd" type="button" onClick={closeModal}>
          Esc
        </button>
      </div>
      <div id="commandResults" className="command-results" role="listbox">
        {items.length === 0 ? (
          <p className="empty-state">
            <span className="empty-state-title">Ничего не найдено</span>
            <span>Попробуйте другое имя или действие</span>
          </p>
        ) : (
          items.map((item, index) => {
            const employee = item.employeeId
              ? data.employees.find((entry) => entry.id === item.employeeId)
              : null;
            return (
              <button
                className={`command-item${index === activeIndex ? ' active' : ''}`}
                key={item.key}
                type="button"
                role="option"
                aria-selected={index === activeIndex}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={item.run}
              >
                {employee ? (
                  <span className="person-cell">
                    <Avatar employee={employee} size="sm" />
                    <span className="person-meta">
                      <span className="person-name">{item.label}</span>
                      <span className="person-sub">{item.hint}</span>
                    </span>
                  </span>
                ) : (
                  <span>{item.label}</span>
                )}
                <span className="command-hint">
                  {employee ? 'Открыть →' : item.hint}
                </span>
              </button>
            );
          })
        )}
      </div>
    </ModalShell>
  );
}
