import type {
  AppData,
  Birthday,
  Employee,
  Leave,
  OnboardingProgress,
  OnboardingTrack,
  StatusMeta,
  VacationBalance,
} from '../types';
import { MONTHS_SHORT_RU, TODAY_ISO } from './date';

export function getOnboardingProgress(track: OnboardingTrack): OnboardingProgress {
  const total = track.tasks.length;
  const done = track.tasks.filter((task) => task.done).length;
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;
  return { done, total, percent };
}

export function getVacationBalance(employee: Employee): VacationBalance {
  const total = employee.vacationTotal || 28;
  const used = employee.vacationUsed || 0;
  return { total, used, remaining: Math.max(0, total - used) };
}

export function getActiveLeaveForEmployee(
  leaves: Leave[],
  employeeId: string,
  dateIso: string = TODAY_ISO,
): Leave | null {
  return (
    leaves.find(
      (leave) =>
        leave.employeeId === employeeId &&
        leave.status === 'approved' &&
        leave.startDate <= dateIso &&
        leave.endDate >= dateIso,
    ) ?? null
  );
}

export function getEmployeeStatusMeta(
  employee: Employee,
  leaves: Leave[],
  dateIso: string = TODAY_ISO,
): StatusMeta {
  const activeLeave = getActiveLeaveForEmployee(leaves, employee.id, dateIso);
  if (activeLeave) {
    if (activeLeave.type === 'sick') {
      return { key: 'on_leave', label: 'Больничный', statusClass: 'status-sick' };
    }
    if (activeLeave.type === 'dayoff') {
      return { key: 'on_leave', label: 'Отгул', statusClass: 'status-on_leave' };
    }
    return { key: 'on_leave', label: 'В отпуске', statusClass: 'status-on_leave' };
  }
  if (employee.status === 'probation') {
    return { key: 'probation', label: 'Испытательный', statusClass: 'status-probation' };
  }
  return { key: 'active', label: 'В штате', statusClass: 'status-active' };
}

export function findDepartmentOverlaps(
  data: AppData,
  employeeId: string,
  startDate: string,
  endDate: string,
  excludeLeaveId?: string,
): Leave[] {
  const employee = data.employees.find((item) => item.id === employeeId);
  if (!employee || !startDate || !endDate) return [];
  return data.leaves.filter((leave) => {
    if (
      leave.id === excludeLeaveId ||
      leave.status === 'rejected' ||
      leave.employeeId === employeeId
    ) {
      return false;
    }
    const other = data.employees.find((item) => item.id === leave.employeeId);
    return (
      Boolean(other) &&
      other!.departmentId === employee.departmentId &&
      leave.startDate <= endDate &&
      leave.endDate >= startDate
    );
  });
}

export function getUpcomingBirthdays(employees: Employee[], now = new Date()): Birthday[] {
  const todayZero = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
  const list: Birthday[] = [];

  employees.forEach((employee) => {
    if (!employee.birthday) return;
    const parts = employee.birthday.split('-');
    if (parts.length !== 2) return;
    const month = Number(parts[0]) - 1;
    const day = Number(parts[1]);
    let birthday = new Date(now.getFullYear(), month, day, 12, 0, 0);
    if (birthday < todayZero) birthday = new Date(now.getFullYear() + 1, month, day, 12, 0, 0);
    const daysUntil = Math.round((birthday.getTime() - todayZero.getTime()) / 86_400_000);
    if (daysUntil <= 14) {
      list.push({
        employee,
        daysUntil,
        dateStr: `${birthday.getDate()} ${MONTHS_SHORT_RU[birthday.getMonth()]}`,
        dateIso: `${birthday.getFullYear()}-${String(birthday.getMonth() + 1).padStart(2, '0')}-${String(birthday.getDate()).padStart(2, '0')}`,
      });
    }
  });

  return list.sort((a, b) => a.daysUntil - b.daysUntil);
}
