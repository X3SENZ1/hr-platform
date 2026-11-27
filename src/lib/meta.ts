import type {
  EmployeeStatusFilter,
  LeavePriority,
  LeaveStatus,
  LeaveType,
  ModalKind,
  ThemeName,
  ViewKey,
} from '../types';

export const AVATAR_PALETTES = [
  { bg: '#E5E7EB', color: '#1F2937' },
  { bg: '#DBEAFE', color: '#1E40AF' },
  { bg: '#E0E7FF', color: '#3730A3' },
  { bg: '#D1FAE5', color: '#065F46' },
  { bg: '#FEF3C7', color: '#92400E' },
  { bg: '#FCE7F3', color: '#9D174D' },
];

export const LEAVE_TYPE_META: Record<LeaveType, { label: string; short: string }> = {
  vacation: { label: 'Ежегодный отпуск', short: 'Отпуск' },
  dayoff: { label: 'Отгул', short: 'Отгул' },
  sick: { label: 'Больничный', short: 'Больничный' },
};

export const LEAVE_STATUS_META: Record<LeaveStatus, { label: string; statusClass: string }> = {
  pending: { label: 'На согласовании', statusClass: 'status-probation' },
  approved: { label: 'Одобрено', statusClass: 'status-active' },
  rejected: { label: 'Отклонено', statusClass: 'status-sick' },
};

export const LEAVE_PRIORITY_META: Record<
  LeavePriority,
  { label: string; className: string; icon: string }
> = {
  high: { label: 'Высокий', className: 'priority-high', icon: '▲' },
  normal: { label: 'Обычный', className: 'priority-normal', icon: '●' },
  low: { label: 'Низкий', className: 'priority-low', icon: '▼' },
};

export const EMPLOYEE_STATUS_FILTERS: Array<{
  value: EmployeeStatusFilter;
  label: string;
}> = [
  { value: 'active', label: 'В штате' },
  { value: 'probation', label: 'Испытательный' },
  { value: 'on_leave', label: 'Отсутствует' },
];

export const THEME_META: Record<ThemeName, { label: string; description: string }> = {
  light: { label: 'Светлая', description: 'Нейтральная светлая тема' },
  dark: { label: 'Тёмная', description: 'Тёмная тема для вечерней работы' },
  contrast: { label: 'Контраст', description: 'Высококонтрастная тема' },
};

export const VIEW_META: Record<
  ViewKey,
  { title: string; subtitle: string; ctaLabel: string; cta: ModalKind }
> = {
  overview: {
    title: 'Обзор',
    subtitle: 'Сводка по команде на сегодня',
    ctaLabel: '+ Сотрудник',
    cta: 'addEmployee',
  },
  employees: {
    title: 'Сотрудники',
    subtitle: 'База команды и контакты',
    ctaLabel: '+ Сотрудник',
    cta: 'addEmployee',
  },
  onboarding: {
    title: 'Онбординг',
    subtitle: 'Планы адаптации и чек-листы',
    ctaLabel: '+ Запустить онбординг',
    cta: 'addOnboarding',
  },
  leaves: {
    title: 'Отпуска',
    subtitle: 'Согласование и график отсутствий',
    ctaLabel: '+ Новая заявка',
    cta: 'addLeave',
  },
  structure: {
    title: 'Структура',
    subtitle: 'Оргсхема и состав отделов',
    ctaLabel: '+ Сотрудник',
    cta: 'addEmployee',
  },
};

export const OWNERS = ['all', 'HR', 'Бадди', 'Тимлид', 'Новичок'] as const;

export const ONBOARDING_STAGES = ['День 1', 'Первая неделя', 'Первый месяц'];

export const EMPLOYEE_FORMATS = ['Гибрид', 'Удалённо', 'Офис'];

export const EMPLOYEES_PAGE_SIZE = 8;
export const LEAVES_PAGE_SIZE = 8;
