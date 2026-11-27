import { NavLink } from 'react-router-dom';
import { useHr } from '../state/HrContext';
import type { ViewKey } from '../types';
import {
  BrandMark,
  IconClose,
  IconEmployees,
  IconLeaves,
  IconOnboarding,
  IconOverview,
  IconStructure,
} from './icons';
import { Avatar } from './ui';

const NAV_ITEMS: Array<{
  view: ViewKey;
  label: string;
  icon: typeof IconOverview;
}> = [
  { view: 'overview', label: 'Обзор', icon: IconOverview },
  { view: 'employees', label: 'Сотрудники', icon: IconEmployees },
  { view: 'onboarding', label: 'Онбординг', icon: IconOnboarding },
  { view: 'leaves', label: 'Отпуска', icon: IconLeaves },
  { view: 'structure', label: 'Структура', icon: IconStructure },
];

export function Sidebar() {
  const { data, ui, patchUi, openDrawer, resetDemo, getOnboardingProgress, getEmployee } = useHr();

  const activeOnboarding = data.onboarding.filter(
    (track) => getOnboardingProgress(track).percent < 100,
  ).length;
  const pendingLeaves = data.leaves.filter((leave) => leave.status === 'pending').length;
  const currentUser = getEmployee('emp-12');

  const countFor = (view: ViewKey): { count: number; warn?: boolean } | null => {
    if (view === 'employees') return { count: data.employees.length };
    if (view === 'onboarding') return { count: activeOnboarding };
    if (view === 'leaves') return { count: pendingLeaves, warn: true };
    return null;
  };

  return (
    <aside
      id="sidebar"
      className={`sidebar${ui.sidebarOpen ? ' open' : ''}`}
      aria-label="Боковая навигация"
    >
      <header className="sidebar-header">
        <NavLink to="/overview" className="brand" onClick={() => patchUi({ sidebarOpen: false })}>
          <span className="brand-mark" aria-hidden="true">
            <BrandMark />
          </span>
          <span className="brand-text">
            <span className="brand-name">Основа</span>
            <span className="brand-company">Аврора Тех</span>
          </span>
        </NavLink>
        <button
          className="icon-btn sidebar-close"
          type="button"
          aria-label="Закрыть меню"
          onClick={() => patchUi({ sidebarOpen: false })}
        >
          <IconClose />
        </button>
      </header>

      <nav className="sidebar-nav" aria-label="Основная навигация">
        <ul className="nav-list">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const count = countFor(item.view);
            return (
              <li key={item.view}>
                <NavLink
                  to={`/${item.view}`}
                  className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                  onClick={() => patchUi({ sidebarOpen: false })}
                >
                  <Icon className="nav-icon" />
                  <span>{item.label}</span>
                  {count ? (
                    <span
                      className={`nav-count${count.warn ? ' warn' : ''}${count.count === 0 ? ' is-zero' : ''}`}
                      aria-label={`${count.count}`}
                    >
                      {count.count}
                    </span>
                  ) : null}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <footer className="sidebar-footer">
        <button
          className="current-user-btn"
          type="button"
          onClick={() => currentUser && openDrawer(currentUser.id)}
        >
          <Avatar employee={currentUser} size="sm" />
          <span className="current-user-info">
            <span className="current-user-name">{currentUser?.name ?? 'Анна Ковалёва'}</span>
            <span className="current-user-role">{currentUser?.role ?? 'HR-директор'}</span>
          </span>
        </button>
        <button className="btn-reset-demo" type="button" onClick={resetDemo}>
          Сбросить демо-данные
        </button>
      </footer>
    </aside>
  );
}
