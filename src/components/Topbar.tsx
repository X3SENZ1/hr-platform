import { useLocation } from 'react-router-dom';
import { useHr } from '../state/HrContext';
import { useTheme } from '../state/ThemeContext';
import { ACCENT_PRESETS, DEFAULT_ACCENT } from '../state/ThemeContext';
import { THEME_META, VIEW_META } from '../lib/meta';
import type { ThemePreference, ViewKey } from '../types';
import { IconSearch } from './icons';

export function Topbar() {
  const location = useLocation();
  const { ui, patchUi, openModal } = useHr();
  const { preference, accent, setPreference, setAccent } = useTheme();
  const view = (location.pathname.split('/')[1] || 'overview') as ViewKey;
  const meta = VIEW_META[view] ?? VIEW_META.overview;

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          className={`hamburger${ui.sidebarOpen ? ' open' : ''}`}
          type="button"
          aria-label={ui.sidebarOpen ? 'Закрыть меню' : 'Открыть меню'}
          aria-expanded={ui.sidebarOpen}
          aria-controls="sidebar"
          onClick={() => patchUi({ sidebarOpen: !ui.sidebarOpen })}
        >
          <span />
          <span />
          <span />
        </button>
        <div className="topbar-titles">
          <h1 id="pageTitle" className="page-title">
            {meta.title}
          </h1>
          <p id="pageSubtitle" className="page-subtitle">
            {meta.subtitle}
          </p>
        </div>
      </div>

      <div className="topbar-actions">
        <div className="theme-control">
          <label className="visually-hidden" htmlFor="themeSelect">
            Тема оформления
          </label>
          <select
            id="themeSelect"
            className="theme-select"
            value={preference}
            onChange={(event) => setPreference(event.target.value as ThemePreference)}
          >
            <option value="system">Системная тема</option>
            {(Object.keys(THEME_META) as Array<keyof typeof THEME_META>).map((theme) => (
              <option value={theme} key={theme}>
                {THEME_META[theme].label}
              </option>
            ))}
          </select>
        </div>

        <div className="accent-control">
          <label className="visually-hidden" htmlFor="accentColor">
            Акцентный цвет
          </label>
          <input
            id="accentColor"
            className="accent-input"
            type="color"
            value={accent}
            onChange={(event) => setAccent(event.target.value)}
            title="Выбрать акцентный цвет"
          />
          <div className="accent-presets" role="group" aria-label="Быстрый выбор акцента">
            {ACCENT_PRESETS.map((preset) => (
              <button
                key={preset}
                className={`accent-swatch${accent === preset ? ' active' : ''}`}
                type="button"
                style={{ background: preset }}
                aria-label={`Акцент ${preset}`}
                aria-pressed={accent === preset}
                onClick={() => setAccent(preset)}
              />
            ))}
            <button
              className={`accent-swatch accent-swatch-reset${accent === DEFAULT_ACCENT ? ' active' : ''}`}
              type="button"
              aria-label="Сбросить акцентный цвет"
              onClick={() => setAccent(DEFAULT_ACCENT)}
            >
              ↺
            </button>
          </div>
        </div>

        <button
          id="commandTriggerBtn"
          className="command-trigger"
          type="button"
          title="Быстрый поиск (Ctrl+K)"
          onClick={() => openModal('command')}
        >
          <IconSearch size={15} />
          <span className="command-trigger-text">Поиск…</span>
          <kbd className="kbd">Ctrl K</kbd>
        </button>

        <button
          id="primaryCtaBtn"
          className="btn btn-primary topbar-cta"
          type="button"
          aria-label={meta.ctaLabel.replace(/^\+\s*/, '')}
          onClick={() => openModal(meta.cta)}
        >
          <span aria-hidden="true">+</span>
          <span>{meta.ctaLabel.replace(/^\+\s*/, '')}</span>
        </button>
      </div>
    </header>
  );
}
