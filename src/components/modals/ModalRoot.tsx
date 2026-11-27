import { useHr } from '../../state/HrContext';
import { AddEmployeeModal } from './AddEmployeeModal';
import { AddLeaveModal } from './AddLeaveModal';
import { AddOnboardingModal } from './AddOnboardingModal';
import { CommandPalette } from './CommandPalette';

export function ModalRoot() {
  const { ui, closeModal } = useHr();
  const active = Boolean(ui.activeModal);

  return (
    <div
      id="modalBackdrop"
      className={`modal-backdrop${active ? ' open' : ''}`}
      aria-hidden={!active}
      onClick={(event) => {
        if (event.target === event.currentTarget) closeModal();
      }}
    >
      {ui.activeModal === 'command' ? <CommandPalette /> : null}
      {ui.activeModal === 'addEmployee' ? <AddEmployeeModal /> : null}
      {ui.activeModal === 'addLeave' ? <AddLeaveModal /> : null}
      {ui.activeModal === 'addOnboarding' ? <AddOnboardingModal /> : null}
    </div>
  );
}

export function ToastContainer() {
  const { toasts } = useHr();
  return (
    <div id="toastContainer" className="toast-container" aria-live="polite" aria-atomic="false">
      {toasts.map((toast) => (
        <p className="toast" key={toast.id} role="status">
          <span className="toast-icon" aria-hidden="true">
            ✓
          </span>
          {toast.message}
        </p>
      ))}
    </div>
  );
}
