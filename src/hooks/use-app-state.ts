
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { User, AttendanceLog, AttendanceRecord, Room } from '@/lib/types';
import { generateQrCode } from '@/ai/flows/generate-qr-code-from-user-profile';
import { decrypt } from '@/lib/crypto';
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
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut,
  User as FirebaseUser
} from 'firebase/auth';

type UserData = Omit<User, 'id' | 'qrCode' | 'adminId'>;

const useAppState = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
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
        setUsers([]);
        setRooms([]);
        setAttendanceLog({});
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

    const usersQuery = query(collection(db, "users"), where("adminId", "==", firebaseUser.uid));
    const usersUnsubscribe = onSnapshot(usersQuery, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as User[];
      setUsers(usersData);
    });

    return () => usersUnsubscribe();
  }, [firebaseUser]);
  
  useEffect(() => {
    if (!firebaseUser || !db) {
      setRooms([]);
      return;
    };
    
    const roomsQuery = query(collection(db, "rooms"), where("adminId", "==", firebaseUser.uid));
    const roomsUnsubscribe = onSnapshot(roomsQuery, (snapshot) => {
      const roomsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Room[];
      setRooms(roomsData);
    });

    return () => roomsUnsubscribe();
  }, [firebaseUser]);

  useEffect(() => {
    if (!firebaseUser || !db) {
      setAttendanceLog({});
      return;
    }

    const attendanceQuery = query(collection(db, 'attendance'), where("adminId", "==", firebaseUser.uid));
    const unsubscribe = onSnapshot(attendanceQuery, (snapshot) => {
      const newLog: AttendanceLog = {};
      snapshot.docs.forEach((doc) => {
        const record = doc.data() as AttendanceRecord;
        if (record.timestamp) {
            const recordDate = (record.timestamp as unknown as Timestamp).toDate();
            // Adjust for timezone offset before getting the date string
            const tzAdjustedDate = new Date(recordDate.getTime() - (recordDate.getTimezoneOffset() * 60000));
            const date = tzAdjustedDate.toISOString().split('T')[0];

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


  const addUser = async (userData: UserData) => {
    if (!db || !firebaseUser) return;
    const userProfile = { 
      firstName: userData.firstName, 
      lastName: userData.lastName, 
      studentId: userData.studentId,
      roomId: userData.roomId,
    };
    const { qrCodeDataUri } = await generateQrCode({ userProfile: JSON.stringify(userProfile) });
    const newUser = { ...userData, qrCode: qrCodeDataUri, adminId: firebaseUser.uid };
    return addDoc(collection(db, "users"), newUser);
  };

  const updateUser = async (id: string, userData: UserData) => {
    if (!db) return;
    const userProfile = { 
        firstName: userData.firstName, 
        lastName: userData.lastName, 
        studentId: userData.studentId,
        roomId: userData.roomId
    };
    const { qrCodeDataUri } = await generateQrCode({ userProfile: JSON.stringify(userProfile) });
    const userDocRef = doc(db, 'users', id);
    return updateDoc(userDocRef, { ...userData, qrCode: qrCodeDataUri });
  };

  const deleteUser = async (id: string) => {
    if (!db) return;
    await deleteDoc(doc(db, "users", id));
  };

  const addRoom = async (name: string, teacher?: string) => {
    if (!db || !firebaseUser) return;
    return addDoc(collection(db, "rooms"), { name, teacher: teacher || "", adminId: firebaseUser.uid });
  };

  const updateRoom = async (id: string, name: string, teacher?: string) => {
    if (!db) return;
    const roomDocRef = doc(db, 'rooms', id);
    return updateDoc(roomDocRef, { name, teacher: teacher || "" });
  };

  const deleteRoom = async (id: string) => {
    if (!db) return;
    await deleteDoc(doc(db, "rooms", id));
  };


  const logAttendance = useCallback(async (scannedData: string, roomId?: string) => {
    if (!db || !firebaseUser) return { success: false, message: "Database not connected." };
    try {
      const decryptedData = await decrypt(scannedData);
      const { firstName, lastName, studentId, roomId: userRoomId } = JSON.parse(decryptedData);
      
      const usersQuery = query(
        collection(db, 'users'), 
        where('studentId', '==', studentId), 
        where('firstName', '==', firstName),
        where('lastName', '==', lastName),
        where('adminId', '==', firebaseUser.uid)
      );
      const userSnapshot = await getDocs(usersQuery);

      if (userSnapshot.empty) {
        return { success: false, message: "User not found." };
      }

      const userDoc = userSnapshot.docs[0];
      const user = { ...userDoc.data(), id: userDoc.id } as User;
      
      if (roomId && user.roomId !== roomId) {
        return { success: false, message: `User does not belong to this room.` };
      }

      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      
      const attendanceQuery = query(
        collection(db, 'attendance'),
        where('user.id', '==', user.id),
        where('adminId', '==', firebaseUser.uid)
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
          adminId: firebaseUser.uid,
          roomId: user.roomId
        }, 
        timestamp: new Date(),
        roomId: roomId || user.roomId,
        adminId: firebaseUser.uid,
      };
      
      await addDoc(collection(db, 'attendance'), newRecord);

      return { success: true, user };
      
    } catch (error) {
      console.error(error);
      return { success: false, message: "Invalid or corrupt QR code data." };
    }
  }, [toast, firebaseUser, db]);

  const refreshAllQrCodes = async () => {
    if (!db || !firebaseUser) {
      toast({ variant: "destructive", title: "Error", description: "You must be logged in to perform this action." });
      return;
    }
    
    toast({ title: "Refreshing QR Codes", description: "This may take a few moments..." });

    try {
      // Process users in batches to avoid timeout issues
      const batchSize = 100;
      for (let i = 0; i < users.length; i += batchSize) {
        const batchUsers = users.slice(i, i + batchSize);
        const batch = writeBatch(db);
        
        for (const user of batchUsers) {
          const userProfile = { 
            firstName: user.firstName, 
            lastName: user.lastName, 
            studentId: user.studentId,
            roomId: user.roomId,
          };
          const { qrCodeDataUri } = await generateQrCode({ userProfile: JSON.stringify(userProfile) });
          
          const userDocRef = doc(db, 'users', user.id);
          batch.update(userDocRef, { qrCode: qrCodeDataUri });
        }
        
        await batch.commit();
      }

      toast({ title: "Success", description: "All QR codes have been refreshed." });
    } catch(error) {
      console.error("Failed to refresh QR codes: ", error);
      toast({ variant: "destructive", title: "Refresh Failed", description: "An error occurred while refreshing QR codes." });
    }
  };
  
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
    rooms,
    addRoom,
    updateRoom,
    deleteRoom,
    attendanceLog,
    logAttendance,
    refreshAllQrCodes,
    loading,
    isAuthenticated,
    login,
    logout,
  };
};

export default useAppState;
