"use client";

import { useState, useEffect, useCallback } from 'react';
import type { User, AttendanceLog, AttendanceRecord } from '@/lib/types';
import { generateQrCode } from '@/ai/flows/generate-qr-code-from-user-profile';

const useAppState = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [attendanceLog, setAttendanceLog] = useState<AttendanceLog>({});
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const generateId = () => {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
      return window.crypto.randomUUID();
    }
    // Fallback for older browsers or non-browser environments (though it should only run client-side)
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  };

  useEffect(() => {
    try {
      const storedUsers = localStorage.getItem('qtrack-users');
      if (storedUsers) {
        setUsers(JSON.parse(storedUsers));
      }
      const storedLogs = localStorage.getItem('qtrack-logs');
      if (storedLogs) {
        setAttendanceLog(JSON.parse(storedLogs));
      }
      const storedAuth = localStorage.getItem('qtrack-auth');
      if (storedAuth) {
        setIsAuthenticated(JSON.parse(storedAuth));
      }
    } catch (error) {
      console.error("Failed to parse from localStorage", error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!loading) {
      localStorage.setItem('qtrack-users', JSON.stringify(users));
    }
  }, [users, loading]);

  useEffect(() => {
    if (!loading) {
      localStorage.setItem('qtrack-logs', JSON.stringify(attendanceLog));
    }
  }, [attendanceLog, loading]);

  useEffect(() => {
    if(!loading) {
      localStorage.setItem('qtrack-auth', JSON.stringify(isAuthenticated));
    }
  }, [isAuthenticated, loading]);

  const addUser = async (name: string, studentId: string) => {
    const userProfile = JSON.stringify({ name, studentId });
    const { qrCodeDataUri } = await generateQrCode({ userProfile });
    const newUser: User = { id: generateId(), name, studentId, qrCode: qrCodeDataUri };
    setUsers(prevUsers => [...prevUsers, newUser]);
    return newUser;
  };

  const updateUser = async (id: string, name: string, studentId: string) => {
    const userProfile = JSON.stringify({ name, studentId });
    const { qrCodeDataUri } = await generateQrCode({ userProfile });
    setUsers(prevUsers =>
      prevUsers.map(user =>
        user.id === id ? { ...user, name, studentId, qrCode: qrCodeDataUri } : user
      )
    );
  };

  const deleteUser = (id: string) => {
    setUsers(prevUsers => prevUsers.filter(user => user.id !== id));
  };

  const logAttendance = useCallback((scannedData: string) => {
    try {
      const { name, studentId } = JSON.parse(scannedData);
      const user = users.find(u => u.name === name && u.studentId === studentId);

      if (user) {
        const today = new Date().toISOString().split('T')[0];
        
        const dayLog = attendanceLog[today] || [];
        if (dayLog.some(record => record.user.id === user.id)) {
            return { success: false, message: "User already logged in today." };
        }

        const newRecord: AttendanceRecord = { user, timestamp: new Date().toISOString() };
        
        setAttendanceLog(prevLog => {
            return {
                ...prevLog,
                [today]: [...(prevLog[today] || []), newRecord]
            };
        });

        return { success: true, user };
      }
      return { success: false, message: "User not found." };
    } catch (error) {
      return { success: false, message: "Invalid QR code data." };
    }
  }, [users, attendanceLog]);
  
  const login = (user: string, pass: string) => {
    if (user === 'admin' && pass === 'password') {
      setIsAuthenticated(true);
      return true;
    }
    return false;
  }

  const logout = () => {
    setIsAuthenticated(false);
  }

  return {
    users,
    addUser,
    updateUser,
    deleteUser,
    attendanceLog,
    logAttendance,
    loading,
    isAuthenticated,
    login,
    logout,
  };
};

export default useAppState;
