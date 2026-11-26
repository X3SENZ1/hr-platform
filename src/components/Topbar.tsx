import { useLocation } from 'react-router-dom';
import { useHr } from '../state/HrContext';
import { VIEW_META } from '../lib/meta';
import type { ViewKey } from '../types';
import { IconMenu, IconSearch } from './icons';

export function Topbar() {
  const location = useLocation();
  const { patchUi, openModal } = useHr();
  const view = (location.pathname.split('/')[1] || 'overview') as ViewKey;
  const meta = VIEW_META[view] ?? VIEW_META.overview;

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          className="icon-btn mobile-only"
          type="button"
          aria-label="Открыть меню"
          onClick={() => patchUi({ sidebarOpen: true })}
        >
          <IconMenu />
        </button>
        <div className="topbar-titles">
          <h1 id="pageTitle" className="page-title">
            {meta.title}
          </h1>
          <span id="pageSubtitle" className="page-subtitle">
            {meta.subtitle}
          </span>
        </div>
      </div>

      <div className="topbar-actions">
        <button
          id="commandTriggerBtn"
          className="command-trigger"
          type="button"
          title="Быстрый поиск (Ctrl+K)"
          onClick={() => openModal('command')}
        >
          <IconSearch size={14} />
          <span className="command-trigger-text">Поиск...</span>
          <kbd className="kbd">Ctrl K</kbd>
        </button>

        <button
          id="primaryCtaBtn"
          className="btn btn-primary"
          type="button"
          onClick={() => openModal(meta.cta)}
        >
          <span id="primaryCtaLabel">{meta.ctaLabel}</span>
        </button>
      </div>
    </header>
  );
}
