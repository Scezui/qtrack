export interface User {
  id: string;
  name: string;
  studentId: string;
  qrCode: string;
}

export interface AttendanceRecord {
  user: User;
  timestamp: string;
}

export type AttendanceLog = Record<string, AttendanceRecord[]>;
