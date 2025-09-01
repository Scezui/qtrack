export interface User {
  id: string;
  name: string;
  studentId: string;
  qrCode: string;
}

export interface AttendanceRecord {
  id?: string;
  user: User;
  timestamp: Date | string;
}

export type AttendanceLog = Record<string, AttendanceRecord[]>;
