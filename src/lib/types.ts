export interface User {
  id: string;
  firstName: string;
  lastName: string;
  studentId: string;
  qrCode: string;
}

export interface AttendanceRecord {
  id?: string;
  user: User;
  timestamp: Date | string;
}

export type AttendanceLog = Record<string, AttendanceRecord[]>;
