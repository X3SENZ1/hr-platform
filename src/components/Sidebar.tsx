import { useLocation } from 'react-router-dom';
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
  const location = useLocation();
  const { data, ui, patchUi, goTo, openDrawer, resetDemo, getOnboardingProgress, getEmployee } =
    useHr();

  const activeView = (location.pathname.split('/')[1] || 'overview') as ViewKey;
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
      aria-label="Навигация"
    >
      <div className="sidebar-header">
        <a
          href="#/overview"
          className="brand"
          onClick={(event) => {
            event.preventDefault();
            goTo('overview');
          }}
        >
          <span className="brand-mark" aria-hidden="true">
            <BrandMark />
          </span>
          <span className="brand-text">
            <span className="brand-name">Основа</span>
            <span className="brand-company">Аврора Тех</span>
          </span>
        </a>
        <button
          className="icon-btn mobile-only"
          type="button"
          aria-label="Закрыть меню"
          onClick={() => patchUi({ sidebarOpen: false })}
        >
          <IconClose />
        </button>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const count = countFor(item.view);
          return (
            <button
              key={item.view}
              className={`nav-item${activeView === item.view ? ' active' : ''}`}
              data-view={item.view}
              type="button"
              onClick={() => goTo(item.view)}
            >
              <Icon className="nav-icon" />
              <span>{item.label}</span>
              {count && (
                <span
                  className={`nav-count${count.warn ? ' warn' : ''}${count.count === 0 ? ' is-zero' : ''}`}
                >
                  {count.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
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
      </div>
    </aside>
  );
}
