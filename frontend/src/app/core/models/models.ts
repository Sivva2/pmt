export type Role = 'ADMIN' | 'MEMBER' | 'OBSERVER';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH';
export type Status = 'TODO' | 'IN_PROGRESS' | 'DONE';

export interface User {
  id: number;
  username: string;
  email: string;
}

export interface Project {
  id: number;
  name: string;
  description: string | null;
  createdByUsername: string;
  createdAt: string;
}

export interface ProjectMember {
  id: number;
  userId: number;
  username: string;
  email: string;
  role: Role;
}

export interface Task {
  id: number;
  name: string;
  description: string | null;
  priority: Priority;
  status: Status;
  dueDate: string | null;
  projectId: number;
  assigneeId: number | null;
  assigneeUsername: string | null;
  createdByUsername: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskHistoryEntry {
  id: number;
  username: string;
  fieldChanged: string;
  oldValue: string | null;
  newValue: string | null;
  changedAt: string;
}

export interface Notification {
  id: number;
  taskId: number | null;
  message: string;
  read: boolean;
  createdAt: string;
}
