import type { FormEvent } from 'react';
import { useHr } from '../../state/HrContext';
import { TODAY_ISO } from '../../lib/date';
import { EMPLOYEE_FORMATS } from '../../lib/meta';
import { IconClose } from '../icons';

export function AddEmployeeModal() {
  const { data, addEmployee, closeModal } = useHr();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get('name') || '').trim();
    const role = String(formData.get('role') || '').trim();
    const email = String(formData.get('email') || '').trim();
    if (!name || !role || !email) return;

    addEmployee({
      name,
      role,
      departmentId: String(formData.get('departmentId') || 'eng'),
      managerId: String(formData.get('managerId') || '') || null,
      format: String(formData.get('format') || 'Гибрид'),
      city: String(formData.get('city') || 'Москва').trim() || 'Москва',
      startDate: String(formData.get('startDate') || TODAY_ISO),
      email,
      telegram: String(formData.get('telegram') || '').trim(),
      startOnboarding: formData.get('startOnboarding') === 'on',
    });
  };

  return (
    <div
      id="addEmployeeModal"
      className="modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="addEmployeeTitle"
    >
      <div className="modal-header">
        <h2 id="addEmployeeTitle" className="modal-title">
          Новый сотрудник
        </h2>
        <button className="icon-btn" type="button" aria-label="Закрыть" onClick={closeModal}>
          <IconClose size={16} />
        </button>
      </div>
      <form className="modal-form" onSubmit={handleSubmit}>
        <div className="form-grid">
          <label className="form-field full">
            <span>ФИО *</span>
            <input type="text" name="name" required placeholder="Дмитрий Волков" />
          </label>
          <label className="form-field">
            <span>Должность *</span>
            <input type="text" name="role" required placeholder="Product Designer" />
          </label>
          <label className="form-field">
            <span>Отдел *</span>
            <select name="departmentId" defaultValue="eng" required>
              {data.departments.map((department) => (
                <option value={department.id} key={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
          </label>
          <label className="form-field">
            <span>Руководитель</span>
            <select name="managerId" defaultValue="emp-2">
              <option value="">Без руководителя</option>
              {data.employees.map((employee) => (
                <option value={employee.id} key={employee.id}>
                  {employee.name} — {employee.role}
                </option>
              ))}
            </select>
          </label>
          <label className="form-field">
            <span>Формат</span>
            <select name="format" defaultValue="Гибрид">
              {EMPLOYEE_FORMATS.map((format) => (
                <option value={format} key={format}>
                  {format}
                </option>
              ))}
            </select>
          </label>
          <label className="form-field">
            <span>Город</span>
            <input type="text" name="city" defaultValue="Москва" />
          </label>
          <label className="form-field">
            <span>Дата выхода *</span>
            <input type="date" name="startDate" defaultValue={TODAY_ISO} required />
          </label>
          <label className="form-field">
            <span>Email *</span>
            <input
              type="email"
              name="email"
              required
              placeholder="d.volkov@avroratech.ru"
            />
          </label>
          <label className="form-field">
            <span>Telegram</span>
            <input type="text" name="telegram" placeholder="@dvolkov" />
          </label>
          <label className="form-field full checkbox-field">
            <input type="checkbox" name="startOnboarding" defaultChecked />
            <span>Создать план онбординга</span>
          </label>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={closeModal}>
            Отмена
          </button>
          <button type="submit" className="btn btn-primary">
            Добавить
          </button>
        </div>
      </form>
    </div>
  );
}
