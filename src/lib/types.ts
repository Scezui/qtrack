
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  studentId: string;
  qrCode: string;
  roomId?: string;
  adminId: string;
}

export interface AttendanceRecord {
  id?: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    studentId: string;
    qrCode: string;
    roomId?: string;
    adminId: string;
  };
  timestamp: Date | string;
  roomId?: string;
  adminId: string;
}

export type AttendanceLog = Record<string, AttendanceRecord[]>;

export interface Room {
  id: string;
  name: string;
  adminId: string;
  teacher?: string;
}
