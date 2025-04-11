export interface Course {
    courseId?: number;
    courseName: string;
    courseCode: string;
    registrationStart: string;
    registrationEnd: string;
    maxCapacity: number;
    status: string; 
    courseDesc: string; 
    programId: number;
  }

export interface Program {
    programId: number;
    programName: string;
    programDesc: string;
  }