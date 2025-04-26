export interface Permission {
  permissionId: number;
  permissionName: string;
  description: string;
}

export interface Role {
  roleId: number;
  roleName: string;
  description: string;
  permissions: Permission[];
}

export interface Role_Creation {
    roleName: string;
    description: string;
    permissions: Permission[];
}

export interface Course {
  courseId?: number;
  courseName: string;
  courseCode: string;
  registrationStart: string;
  registrationEnd: string;
  maxCapacity: number;
  status: string; 
  courseDesc: string; 
}

// Add other model interfaces here if needed 