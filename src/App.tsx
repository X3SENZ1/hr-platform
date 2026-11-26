import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useHr } from './state/HrContext';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { EmployeeDrawer } from './components/EmployeeDrawer';
import { ModalRoot, ToastContainer } from './components/modals/ModalRoot';
import { Overview } from './views/Overview';
import { Employees } from './views/Employees';
import { Onboarding } from './views/Onboarding';
import { Leaves } from './views/Leaves';
import { Structure } from './views/Structure';

export function Layout() {
  const location = useLocation();
  const { ui, patchUi, openModal, closeModal, closeDrawer } = useHr();

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
      <div className="app-shell">
        <div
          id="sidebarOverlay"
          className={`sidebar-overlay${ui.sidebarOpen ? ' open' : ''}`}
          aria-hidden="true"
          onClick={() => patchUi({ sidebarOpen: false })}
        />
        <Sidebar />
        <div className="main-area">
          <Topbar />
          <main id="mainView" className="main-content" tabIndex={-1}>
            <Routes>
              <Route path="/" element={<Navigate to="/overview" replace />} />
              <Route path="/overview" element={<Overview />} />
              <Route path="/employees" element={<Employees />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/leaves" element={<Leaves />} />
              <Route path="/structure" element={<Structure />} />
              <Route path="*" element={<Navigate to="/overview" replace />} />
            </Routes>
          </main>
        </div>
      </div>
      <EmployeeDrawer />
      <ModalRoot />
      <ToastContainer />
    </>
  );
}
