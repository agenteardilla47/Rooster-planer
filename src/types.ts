export type Role = 'HOST' | 'WAIT' | 'BRUN' | 'KRUN' | 'BART' | 'MGR';

export interface Employee {
  id: number;
  name: string;
  role: Role;
  preferred_start: string;
  status: 'active' | 'vacation';
}

export interface CoverageRule {
  role: Role;
  day_type: 'weekday' | 'weekend';
  min_staff: number;
}

export interface ScheduleEntry {
  id: number;
  employee_id: number;
  date: string;
  shift_start: string | null;
  status: 'working' | 'LIBRE' | 'vacation' | '-';
  name?: string;
  role?: Role;
}

export const ROLES: { [key in Role]: string } = {
  HOST: 'Host / Cashier',
  WAIT: 'Waiter',
  BRUN: 'Bar Runner',
  KRUN: 'Kitchen Runner',
  BART: 'Bartender',
  MGR: 'Manager'
};

export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
