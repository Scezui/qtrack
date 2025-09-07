export interface User {
  id: string;
  firstName: string;
  lastName: string;
  studentId: string;
  qrCode: string;
  roomId?: string; // Add roomId to User
  adminId: string;
}

export interface AttendanceRecord {
  id?: string;
  user: User;
  timestamp: Date | string;
  roomId?: string; // Add roomId to AttendanceRecord
  adminId: string;
}

export type AttendanceLog = Record<string, AttendanceRecord[]>;

export interface Room {
  id: string;
  name: string;
  adminId: string;
}
