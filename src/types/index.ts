// Extended user interface with additional fields from our API
export interface ExtendedUser {
  // Base user fields
  id: string;
  name: string;
  email: string;
  permissions: string[];
  
  // Additional fields from our API
  roles: string[];
  jobTitle?: string;
  department?: string;
  avatarUrl?: string;
  phone?: string;
  
  // User type specific fields
  userType: "student" | "staff";
  
  // Student specific fields
  studentId?: number;
  studentFullId?: string;
  programName?: string;
  
  // Staff specific fields
  staffId?: number;
  staffFullId?: string;
  position?: string;
} 