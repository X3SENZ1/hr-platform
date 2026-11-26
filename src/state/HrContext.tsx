import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { buildDefaultData, buildOnboardingTasks } from '../data/seed';
import { parseISODate } from '../lib/date';
import {
  findDepartmentOverlaps as findDepartmentOverlapsPure,
  getActiveLeaveForEmployee as getActiveLeaveForEmployeePure,
  getEmployeeStatusMeta as getEmployeeStatusMetaPure,
  getOnboardingProgress as getOnboardingProgressPure,
  getUpcomingBirthdays as getUpcomingBirthdaysPure,
  getVacationBalance as getVacationBalancePure,
} from '../lib/hr';
import { AVATAR_PALETTES } from '../lib/meta';
import type {
  AppData,
  Birthday,
  DrawerTab,
  Employee,
  Leave,
  LeaveStatus,
  ModalKind,
  NewEmployeeInput,
  NewLeaveInput,
  NewOnboardingInput,
  OnboardingProgress,
  OnboardingTrack,
  StatusMeta,
  UiState,
  VacationBalance,
  ViewKey,
} from '../types';

const STORAGE_KEY = 'osnova_hr_state_v3';

export interface ToastMessage {
  id: string;
  message: string;
}

interface HrContextValue {
  data: AppData;
  ui: UiState;
  toasts: ToastMessage[];

  patchUi: (patch: Partial<UiState>) => void;
  openModal: (modal: ModalKind, options?: { employeeId?: string }) => void;
  closeModal: () => void;
  openDrawer: (employeeId: string) => void;
  closeDrawer: () => void;
  setDrawerTab: (tab: DrawerTab) => void;
  toggleDrawerEditing: () => void;
  showToast: (message: string) => void;

  goTo: (view: ViewKey) => void;
  openDepartment: (departmentId: string) => void;
  jumpToOnboarding: (trackId: string) => void;

  getEmployee: (id: string | null | undefined) => Employee | null;
  getDepartment: (id: string | null | undefined) => AppData['departments'][number] | null;
  getActiveLeaveForEmployee: (employeeId: string, dateIso?: string) => Leave | null;
  getEmployeeStatusMeta: (employee: Employee) => StatusMeta;
  getOnboardingProgress: (track: OnboardingTrack) => OnboardingProgress;
  getOnboardingForEmployee: (employeeId: string) => OnboardingTrack | null;
  getVacationBalance: (employee: Employee) => VacationBalance;
  findDepartmentOverlaps: (
    employeeId: string,
    startDate: string,
    endDate: string,
    excludeLeaveId?: string,
  ) => Leave[];
  getUpcomingBirthdays: () => Birthday[];

  addEmployee: (input: NewEmployeeInput) => void;
  addLeave: (input: NewLeaveInput) => void;
  addOnboarding: (input: NewOnboardingInput) => void;
  decideLeave: (leaveId: string, decision: Exclude<LeaveStatus, 'pending'>) => void;
  deleteLeave: (leaveId: string) => void;
  toggleTask: (trackId: string, taskId: string, done: boolean) => void;
  addTask: (trackId: string, stage: string, title: string, owner: string) => void;
  updateEmployee: (employeeId: string, patch: Partial<Employee>) => void;
  toggleProbation: (employeeId: string) => void;
  resetDemo: () => void;
}

const HrContext = createContext<HrContextValue | null>(null);

function createInitialUi(): UiState {
  const now = new Date();
  return {
    empSearch: '',
    empDept: 'all',
    empStatus: 'all',
    empLayout: 'table',
    onbFilter: 'active',
    onbOwnerFilter: 'all',
    selectedOnbId: null,
    leaveMonth: { year: now.getFullYear(), month: now.getMonth() },
    leaveStatusFilter: 'all',
    leaveDeptFilter: 'all',
    leaveShowAllTimeline: false,
    structureMode: 'tree',
    structureSearch: '',
    sidebarOpen: false,
    drawerEmployeeId: null,
    drawerTab: 'profile',
    drawerEditing: false,
    activeModal: null,
    leavePrefillEmployeeId: null,
    commandQuery: '',
  };
}

function loadState(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AppData>;
      if (
        parsed &&
        Array.isArray(parsed.employees) &&
        Array.isArray(parsed.departments) &&
        Array.isArray(parsed.onboarding) &&
        Array.isArray(parsed.leaves)
      ) {
        return parsed as AppData;
      }
    }
  } catch {
    // Fall back to the default seed.
  }
  return buildDefaultData();
}

export function HrProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [data, setData] = useState<AppData>(loadState);
  const [ui, setUi] = useState<UiState>(createInitialUi);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Ignore quota and private-mode errors.
    }
  }, [data]);

  const patchUi = useCallback((patch: Partial<UiState>) => {
    setUi((prev) => ({ ...prev, ...patch }));
  }, []);

  const showToast = useCallback((message: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setToasts((prev) => [...prev, { id, message }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 2800);
  }, []);

  const openModal = useCallback((modal: ModalKind, options?: { employeeId?: string }) => {
    setUi((prev) => ({
      ...prev,
      activeModal: modal,
      leavePrefillEmployeeId: options?.employeeId ?? null,
      commandQuery: '',
    }));
  }, []);

  const closeModal = useCallback(() => {
    setUi((prev) => ({ ...prev, activeModal: null, leavePrefillEmployeeId: null }));
  }, []);

  const openDrawer = useCallback((employeeId: string) => {
    setUi((prev) => ({
      ...prev,
      drawerEmployeeId: employeeId,
      drawerTab: 'profile',
      drawerEditing: false,
    }));
  }, []);

  const closeDrawer = useCallback(() => {
    setUi((prev) => ({ ...prev, drawerEmployeeId: null, drawerEditing: false }));
  }, []);

  const setDrawerTab = useCallback((tab: DrawerTab) => {
    setUi((prev) => ({ ...prev, drawerTab: tab, drawerEditing: false }));
  }, []);

  const toggleDrawerEditing = useCallback(() => {
    setUi((prev) => ({ ...prev, drawerEditing: !prev.drawerEditing }));
  }, []);

  const goTo = useCallback(
    (view: ViewKey) => {
      setUi((prev) => ({ ...prev, sidebarOpen: false }));
      navigate(`/${view}`);
    },
    [navigate],
  );

  const openDepartment = useCallback(
    (departmentId: string) => {
      setUi((prev) => ({
        ...prev,
        empDept: departmentId,
        empStatus: 'all',
        sidebarOpen: false,
      }));
      navigate('/employees');
    },
    [navigate],
  );

  const getEmployee = useCallback(
    (id: string | null | undefined) =>
      (id && data.employees.find((employee) => employee.id === id)) || null,
    [data.employees],
  );

  const getDepartment = useCallback(
    (id: string | null | undefined) =>
      (id && data.departments.find((department) => department.id === id)) || null,
    [data.departments],
  );

  const getActiveLeaveForEmployee = useCallback(
    (employeeId: string, dateIso?: string) =>
      getActiveLeaveForEmployeePure(data.leaves, employeeId, dateIso),
    [data.leaves],
  );

  const getEmployeeStatusMeta = useCallback(
    (employee: Employee) => getEmployeeStatusMetaPure(employee, data.leaves),
    [data.leaves],
  );

  const getOnboardingForEmployee = useCallback(
    (employeeId: string) =>
      data.onboarding.find((track) => track.employeeId === employeeId) || null,
    [data.onboarding],
  );

  const findDepartmentOverlaps = useCallback(
    (employeeId: string, startDate: string, endDate: string, excludeLeaveId?: string) =>
      findDepartmentOverlapsPure(data, employeeId, startDate, endDate, excludeLeaveId),
    [data],
  );

  const getUpcomingBirthdays = useCallback(
    () => getUpcomingBirthdaysPure(data.employees),
    [data.employees],
  );

  const jumpToOnboarding = useCallback(
    (trackId: string) => {
      const track = data.onboarding.find((item) => item.id === trackId);
      setUi((prev) => ({
        ...prev,
        onbFilter:
          track && getOnboardingProgressPure(track).percent === 100 ? 'completed' : 'active',
        selectedOnbId: trackId,
        drawerEmployeeId: null,
        drawerEditing: false,
        sidebarOpen: false,
      }));
      navigate('/onboarding');
    },
    [data.onboarding, navigate],
  );

  const addEmployee = useCallback(
    (input: NewEmployeeInput) => {
      const stamp = Date.now();
      const newId = `emp-${stamp}`;
      const palette = AVATAR_PALETTES[data.employees.length % AVATAR_PALETTES.length];
      const newEmployee: Employee = {
        id: newId,
        name: input.name,
        role: input.role,
        departmentId: input.departmentId,
        managerId: input.managerId,
        status: input.startOnboarding ? 'probation' : 'active',
        format: input.format,
        city: input.city,
        timezone: 'МСК',
        email: input.email,
        telegram: input.telegram,
        phone: '',
        startDate: input.startDate,
        birthday: '',
        vacationTotal: 28,
        vacationUsed: 0,
        avatarBg: palette.bg,
        avatarColor: palette.color,
      };

      let newTrack: OnboardingTrack | null = null;
      if (input.startOnboarding) {
        const department = data.departments.find((item) => item.id === input.departmentId);
        const buddyId =
          department?.leadId && department.leadId !== newId ? department.leadId : 'emp-12';
        const template = input.departmentId === 'eng' ? 'tech' : 'standard';
        newTrack = {
          id: `onb-${stamp}`,
          employeeId: newId,
          buddyId,
          startedAt: input.startDate,
          tasks: buildOnboardingTasks(template),
        };
      }

      setData((prev) => ({
        ...prev,
        employees: [...prev.employees, newEmployee],
        onboarding: newTrack ? [newTrack, ...prev.onboarding] : prev.onboarding,
      }));

      setUi((prev) => ({
        ...prev,
        activeModal: null,
        leavePrefillEmployeeId: null,
        ...(newTrack ? { selectedOnbId: newTrack.id, onbFilter: 'active' as const } : {}),
      }));
      showToast('Сотрудник добавлен');
    },
    [data.departments, data.employees.length, showToast],
  );

  const addLeave = useCallback(
    (input: NewLeaveInput) => {
      const leave: Leave = {
        id: `lv-${Date.now()}`,
        employeeId: input.employeeId,
        type: input.type,
        startDate: input.startDate,
        endDate: input.endDate,
        status: input.status,
        comment: input.comment,
      };
      const days = Math.max(
        0,
        Math.round(
          (new Date(`${input.endDate}T12:00:00`).getTime() -
            new Date(`${input.startDate}T12:00:00`).getTime()) /
            86_400_000,
        ) + 1,
      );

      setData((prev) => {
        const employees =
          input.status === 'approved' && input.type === 'vacation'
            ? prev.employees.map((employee) =>
                employee.id === input.employeeId
                  ? { ...employee, vacationUsed: (employee.vacationUsed || 0) + days }
                  : employee,
              )
            : prev.employees;
        return { ...prev, employees, leaves: [leave, ...prev.leaves] };
      });

      const startDate = parseISODate(input.startDate);
      setUi((prev) => ({
        ...prev,
        activeModal: null,
        leavePrefillEmployeeId: null,
        ...(startDate
          ? { leaveMonth: { year: startDate.getFullYear(), month: startDate.getMonth() } }
          : {}),
      }));
      showToast('Заявка создана');
    },
    [showToast],
  );

  const addOnboarding = useCallback(
    (input: NewOnboardingInput) => {
      const employee = data.employees.find((item) => item.id === input.employeeId);
      if (!employee) return;

      const existing = data.onboarding.find((track) => track.employeeId === input.employeeId);
      if (existing) {
        setUi((prev) => ({
          ...prev,
          activeModal: null,
          onbFilter: getOnboardingProgressPure(existing).percent === 100 ? 'completed' : 'active',
          selectedOnbId: existing.id,
          sidebarOpen: false,
        }));
        navigate('/onboarding');
        showToast('У сотрудника уже есть план адаптации');
        return;
      }

      const newTrack: OnboardingTrack = {
        id: `onb-${Date.now()}`,
        employeeId: input.employeeId,
        buddyId: input.buddyId,
        startedAt: employee.startDate || new Date().toISOString().slice(0, 10),
        tasks: buildOnboardingTasks(input.template === 'tech' ? 'tech' : 'standard'),
      };

      setData((prev) => ({ ...prev, onboarding: [newTrack, ...prev.onboarding] }));
      setUi((prev) => ({
        ...prev,
        activeModal: null,
        onbFilter: 'active',
        selectedOnbId: newTrack.id,
        sidebarOpen: false,
      }));
      navigate('/onboarding');
      showToast('План онбординга создан');
    },
    [data.employees, data.onboarding, navigate, showToast],
  );

  const decideLeave = useCallback(
    (leaveId: string, decision: Exclude<LeaveStatus, 'pending'>) => {
      setData((prev) => {
        const target = prev.leaves.find((leave) => leave.id === leaveId);
        if (!target) return prev;

        const leaves = prev.leaves.map((leave) =>
          leave.id === leaveId ? { ...leave, status: decision } : leave,
        );

        let employees = prev.employees;
        if (target.status !== 'approved' && decision === 'approved' && target.type === 'vacation') {
          const days = Math.max(
            0,
            Math.round(
              (new Date(`${target.endDate}T12:00:00`).getTime() -
                new Date(`${target.startDate}T12:00:00`).getTime()) /
                86_400_000,
            ) + 1,
          );
          employees = prev.employees.map((employee) =>
            employee.id === target.employeeId
              ? { ...employee, vacationUsed: (employee.vacationUsed || 0) + days }
              : employee,
          );
        }

        return { ...prev, leaves, employees };
      });
      showToast(decision === 'approved' ? 'Заявка одобрена' : 'Заявка отклонена');
    },
    [showToast],
  );

  const deleteLeave = useCallback(
    (leaveId: string) => {
      setData((prev) => {
        const target = prev.leaves.find((leave) => leave.id === leaveId);
        if (!target) return prev;

        let employees = prev.employees;
        if (target.status === 'approved' && target.type === 'vacation') {
          const days = Math.max(
            0,
            Math.round(
              (new Date(`${target.endDate}T12:00:00`).getTime() -
                new Date(`${target.startDate}T12:00:00`).getTime()) /
                86_400_000,
            ) + 1,
          );
          employees = prev.employees.map((employee) =>
            employee.id === target.employeeId
              ? { ...employee, vacationUsed: Math.max(0, (employee.vacationUsed || 0) - days) }
              : employee,
          );
        }

        return {
          ...prev,
          employees,
          leaves: prev.leaves.filter((leave) => leave.id !== leaveId),
        };
      });
      showToast('Заявка удалена');
    },
    [showToast],
  );

  const toggleTask = useCallback((trackId: string, taskId: string, done: boolean) => {
    setData((prev) => ({
      ...prev,
      onboarding: prev.onboarding.map((track) =>
        track.id === trackId
          ? {
              ...track,
              tasks: track.tasks.map((task) => (task.id === taskId ? { ...task, done } : task)),
            }
          : track,
      ),
    }));
  }, []);

  const addTask = useCallback((trackId: string, stage: string, title: string, owner: string) => {
    setData((prev) => ({
      ...prev,
      onboarding: prev.onboarding.map((track) =>
        track.id === trackId
          ? {
              ...track,
              tasks: [
                ...track.tasks,
                { id: `t-${Date.now()}`, stage, title, owner, done: false },
              ],
            }
          : track,
      ),
    }));
    showToast('Задача добавлена');
  }, [showToast]);

  const updateEmployee = useCallback(
    (employeeId: string, patch: Partial<Employee>) => {
      setData((prev) => ({
        ...prev,
        employees: prev.employees.map((employee) =>
          employee.id === employeeId ? { ...employee, ...patch } : employee,
        ),
      }));
      showToast('Профиль обновлён');
    },
    [showToast],
  );

  const toggleProbation = useCallback(
    (employeeId: string) => {
      const employee = data.employees.find((item) => item.id === employeeId);
      if (!employee) return;
      const nextStatus = employee.status === 'probation' ? 'active' : 'probation';
      setData((prev) => ({
        ...prev,
        employees: prev.employees.map((item) =>
          item.id === employeeId ? { ...item, status: nextStatus } : item,
        ),
      }));
      showToast(nextStatus === 'active' ? 'Переведён в штат' : 'Установлен испытательный срок');
    },
    [data.employees, showToast],
  );

  const resetDemo = useCallback(() => {
    setData(buildDefaultData());
    setUi(createInitialUi());
    showToast('Демо-данные восстановлены');
  }, [showToast]);

  const value: HrContextValue = {
    data,
    ui,
    toasts,
    patchUi,
    openModal,
    closeModal,
    openDrawer,
    closeDrawer,
    setDrawerTab,
    toggleDrawerEditing,
    showToast,
    goTo,
    openDepartment,
    jumpToOnboarding,
    getEmployee,
    getDepartment,
    getActiveLeaveForEmployee,
    getEmployeeStatusMeta,
    getOnboardingProgress: getOnboardingProgressPure,
    getOnboardingForEmployee,
    getVacationBalance: getVacationBalancePure,
    findDepartmentOverlaps,
    getUpcomingBirthdays,
    addEmployee,
    addLeave,
    addOnboarding,
    decideLeave,
    deleteLeave,
    toggleTask,
    addTask,
    updateEmployee,
    toggleProbation,
    resetDemo,
  };

  return <HrContext.Provider value={value}>{children}</HrContext.Provider>;
}

export function useHr(): HrContextValue {
  const context = useContext(HrContext);
  if (!context) throw new Error('useHr must be used inside HrProvider');
  return context;
}
