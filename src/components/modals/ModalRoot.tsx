import { useHr } from '../../state/HrContext';
import { AddEmployeeModal } from './AddEmployeeModal';
import { AddLeaveModal } from './AddLeaveModal';
import { AddOnboardingModal } from './AddOnboardingModal';
import { CommandPalette } from './CommandPalette';

export function ModalRoot() {
  const { ui, closeModal } = useHr();

  return (
    <div
      id="modalBackdrop"
      className={`modal-backdrop${ui.activeModal ? ' open' : ''}`}
      aria-hidden={!ui.activeModal}
      onClick={(event) => {
        if (event.target === event.currentTarget) closeModal();
      }}
    >
      {ui.activeModal === 'command' && <CommandPalette />}
      {ui.activeModal === 'addEmployee' && <AddEmployeeModal />}
      {ui.activeModal === 'addLeave' && <AddLeaveModal />}
      {ui.activeModal === 'addOnboarding' && <AddOnboardingModal />}
    </div>
  );
}

export function ToastContainer() {
  const { toasts } = useHr();
  return (
    <div id="toastContainer" className="toast-container" aria-live="polite">
      {toasts.map((toast) => (
        <div className="toast" key={toast.id}>
          {toast.message}
        </div>
      ))}
    </div>
  );
}
