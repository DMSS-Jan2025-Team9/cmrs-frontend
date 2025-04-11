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