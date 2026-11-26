import type { FormEvent } from 'react';
import { useHr } from '../../state/HrContext';
import { IconClose } from '../icons';

export function AddOnboardingModal() {
  const { data, addOnboarding, closeModal, getOnboardingForEmployee } = useHr();

  const candidates = data.employees.filter(
    (employee) => !getOnboardingForEmployee(employee.id),
  );
  const availableEmployees = candidates.length ? candidates : data.employees;
  const defaultBuddyId = data.employees.some((employee) => employee.id === 'emp-12')
    ? 'emp-12'
    : (data.employees[0]?.id ?? '');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const employeeId = String(formData.get('employeeId') || '');
    const buddyId = String(formData.get('buddyId') || '');
    if (!employeeId || !buddyId) return;
    addOnboarding({
      employeeId,
      buddyId,
      template: String(formData.get('template') || 'standard'),
    });
  };

  return (
    <div
      id="addOnboardingModal"
      className="modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="addOnboardingTitle"
    >
      <div className="modal-header">
        <h2 id="addOnboardingTitle" className="modal-title">
          Новый план онбординга
        </h2>
        <button className="icon-btn" type="button" aria-label="Закрыть" onClick={closeModal}>
          <IconClose size={16} />
        </button>
      </div>
      <form className="modal-form" onSubmit={handleSubmit}>
        <div className="form-grid">
          <label className="form-field full">
            <span>Сотрудник *</span>
            <select name="employeeId" required defaultValue={availableEmployees[0]?.id ?? ''}>
              {availableEmployees.map((employee) => (
                <option value={employee.id} key={employee.id}>
                  {employee.name} — {employee.role}
                </option>
              ))}
            </select>
          </label>
          <label className="form-field full">
            <span>Наставник (бадди) *</span>
            <select name="buddyId" required defaultValue={defaultBuddyId}>
              {data.employees.map((employee) => (
                <option value={employee.id} key={employee.id}>
                  {employee.name}
                </option>
              ))}
            </select>
          </label>
          <label className="form-field full">
            <span>Шаблон</span>
            <select name="template" defaultValue="standard">
              <option value="standard">Базовый (доступы, процессы, цели)</option>
              <option value="tech">Разработка (репозитории, стенды, код-ревью)</option>
            </select>
          </label>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={closeModal}>
            Отмена
          </button>
          <button type="submit" className="btn btn-primary">
            Запустить
          </button>
        </div>
      </form>
    </div>
  );
}
