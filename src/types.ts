export type ViewKey = 'overview' | 'employees' | 'onboarding' | 'leaves' | 'structure';

export type EmployeeStatus = 'active' | 'probation';

export type LeaveType = 'vacation' | 'dayoff' | 'sick';
export type LeaveStatus = 'pending' | 'approved' | 'rejected';

export type OnboardingFilter = 'active' | 'completed';
export type EmployeeLayout = 'table' | 'cards';
export type StructureMode = 'tree' | 'cards';
export type DrawerTab = 'profile' | 'leaves' | 'onb';
export type ModalKind = 'addEmployee' | 'addLeave' | 'addOnboarding' | 'command';

export interface Department {
  id: string;
  name: string;
  color: string;
  leadId: string;
  openRoles: number;
  description: string;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  departmentId: string;
  managerId: string | null;
  status: EmployeeStatus;
  format: string;
  city: string;
  timezone: string;
  email: string;
  telegram: string;
  phone: string;
  startDate: string;
  birthday: string;
  vacationTotal: number;
  vacationUsed: number;
  avatarBg?: string;
  avatarColor?: string;
}

export interface OnboardingTask {
  id: string;
  stage: string;
  title: string;
  owner: string;
  done: boolean;
}

export interface OnboardingTrack {
  id: string;
  employeeId: string;
  buddyId: string;
  startedAt: string;
  tasks: OnboardingTask[];
}

export interface Leave {
  id: string;
  employeeId: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  status: LeaveStatus;
  comment: string;
}

export interface AppData {
  departments: Department[];
  employees: Employee[];
  onboarding: OnboardingTrack[];
  leaves: Leave[];
}

export interface UiState {
  empSearch: string;
  empDept: string;
  empStatus: string;
  empLayout: EmployeeLayout;
  onbFilter: OnboardingFilter;
  onbOwnerFilter: string;
  selectedOnbId: string | null;
  leaveMonth: { year: number; month: number };
  leaveStatusFilter: 'all' | LeaveStatus;
  leaveDeptFilter: string;
  leaveShowAllTimeline: boolean;
  structureMode: StructureMode;
  structureSearch: string;
  sidebarOpen: boolean;
  drawerEmployeeId: string | null;
  drawerTab: DrawerTab;
  drawerEditing: boolean;
  activeModal: ModalKind | null;
  leavePrefillEmployeeId: string | null;
  commandQuery: string;
}

export interface StatusMeta {
  key: 'active' | 'probation' | 'on_leave';
  label: string;
  statusClass: string;
}

export interface OnboardingProgress {
  done: number;
  total: number;
  percent: number;
}

export interface VacationBalance {
  total: number;
  used: number;
  remaining: number;
}

export interface Birthday {
  employee: Employee;
  daysUntil: number;
  dateStr: string;
}

export interface NewEmployeeInput {
  name: string;
  role: string;
  departmentId: string;
  managerId: string | null;
  format: string;
  city: string;
  startDate: string;
  email: string;
  telegram: string;
  startOnboarding: boolean;
}

export interface NewLeaveInput {
  employeeId: string;
  type: LeaveType;
  status: 'pending' | 'approved';
  startDate: string;
  endDate: string;
  comment: string;
}

export interface NewOnboardingInput {
  employeeId: string;
  buddyId: string;
  template: string;
}
