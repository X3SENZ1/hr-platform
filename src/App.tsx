import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useHr } from './state/HrContext';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { EmployeeDrawer } from './components/EmployeeDrawer';
import { ModalRoot, ToastContainer } from './components/modals/ModalRoot';
import { DashboardSkeleton } from './components/ui';
import logoUrl from './assets/avrora-logo.svg';
import { Overview } from './views/Overview';
import { Employees } from './views/Employees';
import { Onboarding } from './views/Onboarding';
import { Leaves } from './views/Leaves';
import { Structure } from './views/Structure';

export function Layout() {
  const location = useLocation();
  const { ui, patchUi, openModal, closeModal, closeDrawer } = useHr();
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setBooting(false), 500);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        openModal('command');
        return;
      }
      if (event.key === 'Escape') {
        if (ui.activeModal) closeModal();
        else if (ui.drawerEmployeeId) closeDrawer();
        else if (ui.sidebarOpen) patchUi({ sidebarOpen: false });
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [
    ui.activeModal,
    ui.drawerEmployeeId,
    ui.sidebarOpen,
    openModal,
    closeModal,
    closeDrawer,
    patchUi,
  ]);

  return (
    <>
      <a className="skip-link" href="#main-content">
        Перейти к основному контенту
      </a>

      <div className="app-shell">
        <button
          id="sidebarOverlay"
          className={`sidebar-overlay${ui.sidebarOpen ? ' open' : ''}`}
          type="button"
          aria-label="Закрыть меню"
          tabIndex={ui.sidebarOpen ? 0 : -1}
          onClick={() => patchUi({ sidebarOpen: false })}
        />
        <Sidebar />
        <div className="app-main">
          <Topbar />
          <main id="main-content" className="main-content" tabIndex={-1}>
            {booting ? (
              <DashboardSkeleton />
            ) : (
              <Routes>
                <Route path="/" element={<Navigate to="/overview" replace />} />
                <Route path="/overview" element={<Overview />} />
                <Route path="/employees" element={<Employees />} />
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/leaves" element={<Leaves />} />
                <Route path="/structure" element={<Structure />} />
                <Route path="*" element={<Navigate to="/overview" replace />} />
              </Routes>
            )}
          </main>
          <footer className="app-footer">
            <div className="footer-brand">
              <img
                src={logoUrl}
                alt="Логотип компании «Аврора Тех»"
                width={28}
                height={28}
                className="footer-logo"
              />
              <p>© 2026 «Основа». Все права защищены.</p>
            </div>
            <address>
              Москва, Пресненская наб., 12 ·{' '}
              <a href="mailto:hr@avroratech.ru">hr@avroratech.ru</a>
            </address>
            <p className="footer-note">React 19 · Vite · TypeScript</p>
          </footer>
        </div>
      </div>
      <EmployeeDrawer />
      <ModalRoot />
      <ToastContainer />
    </>
  );
}
