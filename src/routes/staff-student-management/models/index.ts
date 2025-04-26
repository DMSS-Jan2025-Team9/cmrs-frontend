// Common interfaces shared between staff and student management

export interface User {
  userId: number;
  username: string;
  email: string;
  name?: string;
  roles: Role[];
}

export interface Role {
  roleName: string;
  roleId?: number;
  description?: string;
}

export interface Role_Edit {
  roleName: string;
}

export interface Staff {
  staffId: number;
  userId: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  fullName?: string;
  staffFullId: string;
  department: string;
  position: string;
  roles: Role[];
}

export interface Student {
  studentId: number;
  userId: number;
  username: string;
  email: string;
  name: string;
  studentIdNumber: string;
  studentFullId: string;
  programName: string;
  enrolledAt?: string;
  firstName?: string;
  lastName?: string;
  roles: Role[];
}

// Request and response interfaces
export interface StaffUpdateRequest {
  email: string;
  firstName: string;
  lastName: string;
  staffFullId: string;
  department: string;
  position: string;
  roles: string[] | Role[];
}

export interface StudentUpdateRequest {
  email: string;
  name: string;
  studentFullId: string;
  programName: string;
  roles: string[] | Role[];
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
} 