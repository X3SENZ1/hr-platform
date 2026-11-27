import { useState, type FormEvent } from 'react';
import { useHr } from '../../state/HrContext';
import { IconClose } from '../icons';
import { ModalShell } from './ModalShell';

export function AddOnboardingModal() {
  const { data, addOnboarding, closeModal, getOnboardingForEmployee } = useHr();
  const [error, setError] = useState('');

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
    if (!employeeId || !buddyId) {
      setError('Выберите сотрудника и наставника.');
      return;
    }
    if (employeeId === buddyId) {
      setError('Наставник и новичок не могут быть одним человеком.');
      document.getElementById('onb-buddyId')?.focus();
      return;
    }
    addOnboarding({
      employeeId,
      buddyId,
      template: String(formData.get('template') || 'standard'),
    });
  };

  return (
    <ModalShell id="addOnboardingModal" labelledBy="addOnboardingTitle">
      <header className="modal-header">
        <div>
          <p className="modal-eyebrow">Онбординг</p>
          <h2 id="addOnboardingTitle" className="modal-title">
            Новый план онбординга
          </h2>
        </div>
        <button className="icon-btn" type="button" aria-label="Закрыть окно" onClick={closeModal}>
          <IconClose size={16} />
        </button>
      </header>
      <form className="modal-form" onSubmit={handleSubmit} noValidate>
        <div className="modal-body">
          <div className="form-grid">
            <div className="form-field full">
              <label htmlFor="onb-employeeId">Сотрудник *</label>
              <select
                id="onb-employeeId"
                name="employeeId"
                required
                defaultValue={availableEmployees[0]?.id ?? ''}
              >
                {availableEmployees.map((employee) => (
                  <option value={employee.id} key={employee.id}>
                    {employee.name} — {employee.role}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field full">
              <label htmlFor="onb-buddyId">Наставник (бадди) *</label>
              <select id="onb-buddyId" name="buddyId" required defaultValue={defaultBuddyId}>
                {data.employees.map((employee) => (
                  <option value={employee.id} key={employee.id}>
                    {employee.name} — {employee.role}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field full">
              <label htmlFor="onb-template">Шаблон</label>
              <select id="onb-template" name="template" defaultValue="standard">
                <option value="standard">Базовый (доступы, процессы, цели)</option>
                <option value="tech">Разработка (репозитории, стенды, код-ревью)</option>
              </select>
            </div>
            {error ? (
              <p className="field-error full" role="alert">
                {error}
              </p>
            ) : null}
          </div>
        </div>
        <footer className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={closeModal}>
            Отмена
          </button>
          <button type="submit" className="btn btn-primary">
            Запустить план
          </button>
        </footer>
      </form>
    </ModalShell>
  );
}
