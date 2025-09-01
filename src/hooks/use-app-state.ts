"use client";

import { useState, useEffect, useCallback } from 'react';
import type { User, AttendanceLog, AttendanceRecord } from '@/lib/types';
import { generateQrCode } from '@/ai/flows/generate-qr-code-from-user-profile';
import { useRouter } from 'next/navigation';
import { useToast } from './use-toast';
import { db, auth } from '@/lib/firebase';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  query,
  where,
  getDocs,
  Timestamp
} from 'firebase/firestore';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut,
  User as FirebaseUser
} from 'firebase/auth';

const useAppState = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [attendanceLog, setAttendanceLog] = useState<AttendanceLog>({});
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthenticated(true);
        setFirebaseUser(user);
      } else {
        setIsAuthenticated(false);
        setFirebaseUser(null);
        router.push('/');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (!firebaseUser) {
      setUsers([]);
      return;
    };

    const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as User[];
      setUsers(usersData);
    });

    return () => unsubscribe();
  }, [firebaseUser]);
  
  useEffect(() => {
    if (!firebaseUser) {
      setAttendanceLog({});
      return;
    }

    const unsubscribe = onSnapshot(collection(db, 'attendance'), (snapshot) => {
      const newLog: AttendanceLog = {};
      snapshot.docs.forEach((doc) => {
        const record = doc.data() as AttendanceRecord;
        const date = (record.timestamp as unknown as Timestamp).toDate().toISOString().split('T')[0];
        if (!newLog[date]) {
          newLog[date] = [];
        }
        newLog[date].push({ ...record, id: doc.id });
      });
      setAttendanceLog(newLog);
    });

    return () => unsubscribe();
  }, [firebaseUser]);


  const addUser = async (name: string, studentId: string) => {
    const userProfile = JSON.stringify({ name, studentId });
    const { qrCodeDataUri } = await generateQrCode({ userProfile });
    const newUser = { name, studentId, qrCode: qrCodeDataUri };
    await addDoc(collection(db, "users"), newUser);
    return newUser as User;
  };

  const updateUser = async (id: string, name: string, studentId: string) => {
    const userProfile = JSON.stringify({ name, studentId });
    const { qrCodeDataUri } = await generateQrCode({ userProfile });
    const userDocRef = doc(db, 'users', id);
    await updateDoc(userDocRef, { name, studentId, qrCode: qrCodeDataUri });
  };

  const deleteUser = async (id: string) => {
    await deleteDoc(doc(db, "users", id));
  };

  const logAttendance = useCallback(async (scannedData: string) => {
    try {
      const { name, studentId } = JSON.parse(scannedData);
      const user = users.find(u => u.name === name && u.studentId === studentId);

      if (user) {
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

        const attendanceQuery = query(
          collection(db, 'attendance'),
          where('user.id', '==', user.id),
          where('timestamp', '>=', startOfDay),
          where('timestamp', '<', endOfDay)
        );

        const querySnapshot = await getDocs(attendanceQuery);

        if (!querySnapshot.empty) {
            return { success: false, message: "User already logged in today." };
        }

        const newRecord: Omit<AttendanceRecord, 'id'> = { user, timestamp: new Date() };
        await addDoc(collection(db, 'attendance'), newRecord);

        return { success: true, user };
      }
      return { success: false, message: "User not found." };
    } catch (error) {
      console.error(error);
      return { success: false, message: "Invalid QR code data." };
    }
  }, [users]);
  
  const login = async (email: string, pass: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      router.push('/dashboard');
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: "Invalid username or password.",
      });
    } finally {
      setLoading(false);
    }
  }

  const logout = async () => {
    await signOut(auth);
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
