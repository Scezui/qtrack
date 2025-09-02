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
    if (!firebaseUser || !db) {
      setUsers([]);
      return;
    };

    const usersCollection = collection(db, "users");
    const unsubscribe = onSnapshot(usersCollection, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as User[];
      setUsers(usersData);
    });

    return () => unsubscribe();
  }, [firebaseUser]);
  
  useEffect(() => {
    if (!firebaseUser || !db) {
      setAttendanceLog({});
      return;
    }

    const attendanceCollection = collection(db, 'attendance');
    const unsubscribe = onSnapshot(attendanceCollection, (snapshot) => {
      const newLog: AttendanceLog = {};
      snapshot.docs.forEach((doc) => {
        const record = doc.data() as AttendanceRecord;
        if (record.timestamp) {
            const date = (record.timestamp as unknown as Timestamp).toDate().toISOString().split('T')[0];
            if (!newLog[date]) {
              newLog[date] = [];
            }
            newLog[date].push({ ...record, id: doc.id });
        }
      });
      setAttendanceLog(newLog);
    });

    return () => unsubscribe();
  }, [firebaseUser]);


  const addUser = async (firstName: string, lastName: string, studentId: string) => {
    if (!db) return;
    const userProfile = { firstName, lastName, studentId };
    const { qrCodeDataUri } = await generateQrCode({ userProfile: JSON.stringify(userProfile) });
    const newUser = { firstName, lastName, studentId, qrCode: qrCodeDataUri };
    return addDoc(collection(db, "users"), newUser);
  };

  const updateUser = async (id: string, firstName: string, lastName: string, studentId: string) => {
    if (!db) return;
    const userProfile = { firstName, lastName, studentId };
    const { qrCodeDataUri } = await generateQrCode({ userProfile: JSON.stringify(userProfile) });
    const userDocRef = doc(db, 'users', id);
    return updateDoc(userDocRef, { firstName, lastName, studentId, qrCode: qrCodeDataUri });
  };

  const deleteUser = async (id: string) => {
    if (!db) return;
    await deleteDoc(doc(db, "users", id));
  };

  const logAttendance = useCallback(async (scannedData: string) => {
    if (!db) return { success: false, message: "Database not connected." };
    try {
      const { firstName, lastName, studentId } = JSON.parse(scannedData);
      
      const usersQuery = query(
        collection(db, 'users'), 
        where('studentId', '==', studentId), 
        where('firstName', '==', firstName),
        where('lastName', '==', lastName)
      );
      const userSnapshot = await getDocs(usersQuery);

      if (userSnapshot.empty) {
        return { success: false, message: "User not found." };
      }

      const userDoc = userSnapshot.docs[0];
      const user = { ...userDoc.data(), id: userDoc.id } as User;
      
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      
      const attendanceQuery = query(
        collection(db, 'attendance'),
        where('user.id', '==', user.id)
      );
      
      const querySnapshot = await getDocs(attendanceQuery);
      const todayEntry = querySnapshot.docs.find(doc => {
        const record = doc.data() as AttendanceRecord;
        if (!record.timestamp) return false;
        const recordDate = (record.timestamp as unknown as Timestamp).toDate();
        return recordDate >= startOfDay;
      })


      if (todayEntry) {
          toast({
            title: 'Already Logged',
            description: `${user.firstName} ${user.lastName} has already been logged for today.`,
          });
          return { success: false, message: "User already logged in today." };
      }

      const newRecord: Omit<AttendanceRecord, 'id'> = { 
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          studentId: user.studentId,
          qrCode: user.qrCode,
        }, 
        timestamp: new Date() 
      };
      await addDoc(collection(db, 'attendance'), newRecord);

      return { success: true, user };
      
    } catch (error) {
      console.error(error);
      return { success: false, message: "Invalid QR code data." };
    }
  }, [toast]);
  
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
