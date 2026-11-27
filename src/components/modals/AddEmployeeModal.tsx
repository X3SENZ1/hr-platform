import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useHr } from '../../state/HrContext';
import { TODAY_ISO } from '../../lib/date';
import { useDebouncedValue } from '../../lib/hooks';
import { EMPLOYEE_FORMATS } from '../../lib/meta';
import { IconClose } from '../icons';
import { ModalShell } from './ModalShell';

interface FormValues {
  name: string;
  role: string;
  departmentId: string;
  managerId: string;
  format: string;
  city: string;
  startDate: string;
  email: string;
  telegram: string;
  startOnboarding: boolean;
}

type FieldKey = keyof FormValues;
type FormErrors = Partial<Record<FieldKey, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const TELEGRAM_PATTERN = /^@?[a-zA-Z0-9_]{4,32}$/;

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};
  const name = values.name.trim();
  const role = values.role.trim();
  const city = values.city.trim();
  const email = values.email.trim();
  const telegram = values.telegram.trim();

  if (name.length < 2) errors.name = 'Укажите имя и фамилию — минимум 2 символа.';
  else if (name.length > 60) errors.name = 'Не более 60 символов.';

  if (role.length < 2) errors.role = 'Укажите должность — минимум 2 символа.';
  else if (role.length > 80) errors.role = 'Не более 80 символов.';

  if (!values.departmentId) errors.departmentId = 'Выберите отдел.';

  if (city.length > 60) errors.city = 'Не более 60 символов.';

  if (!values.startDate) errors.startDate = 'Укажите дату выхода.';
  else if (Number.isNaN(new Date(`${values.startDate}T12:00:00`).getTime())) {
    errors.startDate = 'Дата указана неверно.';
  }

  if (!email) errors.email = 'Укажите рабочий email.';
  else if (!EMAIL_PATTERN.test(email)) errors.email = 'Проверьте формат: name@company.ru.';
  else if (email.length > 120) errors.email = 'Не более 120 символов.';

  if (telegram && !TELEGRAM_PATTERN.test(telegram)) {
    errors.telegram = 'Формат: @username, 4–32 символа (латиница, цифры, _).';
  }

  return errors;
}

export function AddEmployeeModal() {
  const { data, addEmployee, closeModal } = useHr();
  const [values, setValues] = useState<FormValues>({
    name: '',
    role: '',
    departmentId: data.departments[0]?.id ?? 'eng',
    managerId: data.employees[0]?.id ?? '',
    format: 'Гибрид',
    city: 'Москва',
    startDate: TODAY_ISO,
    email: '',
    telegram: '',
    startOnboarding: true,
  });
  const [touched, setTouched] = useState<Partial<Record<FieldKey, boolean>>>({});
  const [errors, setErrors] = useState<FormErrors>({});
  const debouncedValues = useDebouncedValue(values, 350);

  const hasTouched = useMemo(() => Object.keys(touched).length > 0, [touched]);

  useEffect(() => {
    if (hasTouched) setErrors(validate(debouncedValues));
  }, [debouncedValues, hasTouched]);

  const update = <K extends FieldKey>(key: K, value: FormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const markTouched = (key: FieldKey) => {
    setTouched((prev) => ({ ...prev, [key]: true }));
    setErrors(validate(values));
  };

  const fieldError = (key: FieldKey) =>
    touched[key] && errors[key] ? (
      <p className="field-error" id={`emp-${key}-error`} role="alert">
        {errors[key]}
      </p>
    ) : null;

  const fieldProps = (key: FieldKey) => ({
    id: `emp-${key}`,
    name: key,
    'aria-invalid': Boolean(touched[key] && errors[key]),
    'aria-describedby': touched[key] && errors[key] ? `emp-${key}-error` : undefined,
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate(values);
    setTouched({
      name: true,
      role: true,
      departmentId: true,
      city: true,
      startDate: true,
      email: true,
      telegram: true,
    });
    setErrors(nextErrors);
    const firstError = Object.keys(nextErrors)[0] as FieldKey | undefined;
    if (firstError) {
      document.getElementById(`emp-${firstError}`)?.focus();
      return;
    }
    addEmployee({
      name: values.name.trim(),
      role: values.role.trim(),
      departmentId: values.departmentId,
      managerId: values.managerId || null,
      format: values.format,
      city: values.city.trim() || 'Москва',
      startDate: values.startDate,
      email: values.email.trim(),
      telegram: values.telegram.trim(),
      startOnboarding: values.startOnboarding,
    });
  };

  return (
    <ModalShell id="addEmployeeModal" labelledBy="addEmployeeTitle">
      <header className="modal-header">
        <div>
          <p className="modal-eyebrow">Сотрудники</p>
          <h2 id="addEmployeeTitle" className="modal-title">
            Новый сотрудник
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
              <label htmlFor="emp-name">ФИО *</label>
              <input
                {...fieldProps('name')}
                type="text"
                value={values.name}
                placeholder="Дмитрий Волков"
                autoComplete="name"
                onChange={(event) => update('name', event.target.value)}
                onBlur={() => markTouched('name')}
              />
              {fieldError('name')}
            </div>

            <div className="form-field">
              <label htmlFor="emp-role">Должность *</label>
              <input
                {...fieldProps('role')}
                type="text"
                value={values.role}
                placeholder="Product Designer"
                onChange={(event) => update('role', event.target.value)}
                onBlur={() => markTouched('role')}
              />
              {fieldError('role')}
            </div>

            <div className="form-field">
              <label htmlFor="emp-departmentId">Отдел *</label>
              <select
                {...fieldProps('departmentId')}
                value={values.departmentId}
                onChange={(event) => update('departmentId', event.target.value)}
                onBlur={() => markTouched('departmentId')}
              >
                {data.departments.map((department) => (
                  <option value={department.id} key={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
              {fieldError('departmentId')}
            </div>

            <div className="form-field">
              <label htmlFor="emp-managerId">Руководитель</label>
              <select
                {...fieldProps('managerId')}
                value={values.managerId}
                onChange={(event) => update('managerId', event.target.value)}
              >
                <option value="">Без руководителя</option>
                {data.employees.map((employee) => (
                  <option value={employee.id} key={employee.id}>
                    {employee.name} — {employee.role}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="emp-format">Формат работы</label>
              <select
                {...fieldProps('format')}
                value={values.format}
                onChange={(event) => update('format', event.target.value)}
              >
                {EMPLOYEE_FORMATS.map((format) => (
                  <option value={format} key={format}>
                    {format}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="emp-city">Город</label>
              <input
                {...fieldProps('city')}
                type="text"
                value={values.city}
                autoComplete="address-level2"
                onChange={(event) => update('city', event.target.value)}
                onBlur={() => markTouched('city')}
              />
              {fieldError('city')}
            </div>

            <div className="form-field">
              <label htmlFor="emp-startDate">Дата выхода *</label>
              <input
                {...fieldProps('startDate')}
                type="date"
                value={values.startDate}
                onChange={(event) => update('startDate', event.target.value)}
                onBlur={() => markTouched('startDate')}
              />
              {fieldError('startDate')}
            </div>

            <div className="form-field">
              <label htmlFor="emp-email">Email *</label>
              <input
                {...fieldProps('email')}
                type="email"
                value={values.email}
                placeholder="d.volkov@avroratech.ru"
                autoComplete="email"
                onChange={(event) => update('email', event.target.value)}
                onBlur={() => markTouched('email')}
              />
              {fieldError('email')}
            </div>

            <div className="form-field full">
              <label htmlFor="emp-telegram">Telegram</label>
              <input
                {...fieldProps('telegram')}
                type="text"
                value={values.telegram}
                placeholder="@dvolkov"
                onChange={(event) => update('telegram', event.target.value)}
                onBlur={() => markTouched('telegram')}
              />
              {fieldError('telegram')}
            </div>

            <label className="check-control form-field full">
              <input
                type="checkbox"
                name="startOnboarding"
                checked={values.startOnboarding}
                onChange={(event) => update('startOnboarding', event.target.checked)}
              />
              <span className="check-box" aria-hidden="true">
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M2 6.2 4.6 8.8 10 3.4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span>Создать план онбординга</span>
            </label>
          </div>
        </div>
        <footer className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={closeModal}>
            Отмена
          </button>
          <button type="submit" className="btn btn-primary">
            Добавить сотрудника
          </button>
        </footer>
      </form>
    </ModalShell>
  );
}
