export type ViewKey = 'overview' | 'employees' | 'onboarding' | 'leaves' | 'structure';

export type EmployeeStatus = 'active' | 'probation';
export type EmployeeStatusFilter = 'active' | 'probation' | 'on_leave';

export type LeaveType = 'vacation' | 'dayoff' | 'sick';
export type LeaveStatus = 'pending' | 'approved' | 'rejected';
export type LeavePriority = 'low' | 'normal' | 'high';

export type OnboardingFilter = 'active' | 'completed';
export type EmployeeLayout = 'table' | 'cards';
export type StructureMode = 'tree' | 'cards';
export type DrawerTab = 'profile' | 'leaves' | 'onb';
export type ModalKind = 'addEmployee' | 'addLeave' | 'addOnboarding' | 'command';
export type ThemeName = 'light' | 'dark' | 'contrast';
export type ThemePreference = 'system' | ThemeName;

export interface Department {
  id: string;
  code: string;
  name: string;
  color: string;
  leadId: string;
  openRoles: number;
  description: string;
  createdAt: string;
  goals: string[];
}

export interface EmployeeContacts {
  emergencyName: string;
  emergencyPhone: string;
}

export interface EmployeeEquipment {
  laptop: string;
  monitor: string;
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
  skills?: string[];
  tags?: string[];
  contacts?: EmployeeContacts;
  equipment?: EmployeeEquipment;
  bio?: string;
}

export interface OnboardingTask {
  id: string;
  stage: string;
  title: string;
  owner: string;
  done: boolean;
  priority?: LeavePriority;
}

export interface OnboardingTrack {
  id: string;
  employeeId: string;
  buddyId: string;
  startedAt: string;
  tasks: OnboardingTask[];
  template: 'standard' | 'tech';
  status: 'active' | 'completed';
  notes: string;
  completedAt?: string;
}

export interface LeaveApproval {
  id: string;
  by: string;
  at: string;
  decision: Exclude<LeaveStatus, 'pending'>;
  comment?: string;
}

export interface LeaveHandover {
  backupEmployeeId: string;
  note: string;
}

export interface Leave {
  id: string;
  employeeId: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  status: LeaveStatus;
  comment: string;
  priority?: LeavePriority;
  createdAt?: string;
  approvals?: LeaveApproval[];
  handover?: LeaveHandover;
}

export interface AppData {
  departments: Department[];
  employees: Employee[];
  onboarding: OnboardingTrack[];
  leaves: Leave[];
}

export type EmployeeSortKey =
  | 'name'
  | 'role'
  | 'department'
  | 'city'
  | 'status'
  | 'vacation';

export type SortDirection = 'asc' | 'desc';

export interface UiState {
  empSearch: string;
  empDept: string;
  empStatuses: EmployeeStatusFilter[];
  empLayout: EmployeeLayout;
  empSortKey: EmployeeSortKey;
  empSortDir: SortDirection;
  empPage: number;
  onbFilter: OnboardingFilter;
  onbOwnerFilter: string;
  selectedOnbId: string | null;
  leaveMonth: { year: number; month: number };
  leaveStatusFilter: 'all' | LeaveStatus;
  leaveDeptFilter: string;
  leaveShowAllTimeline: boolean;
  leavePage: number;
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
  key: EmployeeStatusFilter;
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
  dateIso: string;
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
  priority: LeavePriority;
}

export interface NewOnboardingInput {
  employeeId: string;
  buddyId: string;
  template: string;
}
