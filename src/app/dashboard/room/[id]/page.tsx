
"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useApp } from '@/components/providers';
import type { Room, User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { UserTable } from '@/components/user-table';
import { UserForm } from '@/components/user-form';
import { AttendanceLog } from '@/components/attendance-log';
import { QrScanner } from '@/components/qr-scanner';
import { PlusCircle, ArrowLeft, Users, Calendar, ScanLine } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from '@/components/ui/skeleton';

export default function RoomPage() {
  const { id: roomId } = useParams();
  const router = useRouter();
  const { rooms, users, logAttendance, attendanceLog } = useApp();
  const [room, setRoom] = useState<Room | null>(null);
  const [roomUsers, setRoomUsers] = useState<User[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    const currentRoom = rooms.find(r => r.id === roomId);
    if (currentRoom) {
      setRoom(currentRoom);
    }
  }, [roomId, rooms]);

  useEffect(() => {
    if (roomId) {
      const filteredUsers = users.filter(u => u.roomId === roomId);
      setRoomUsers(filteredUsers);
    }
  }, [roomId, users]);

  if (!room) {
    return (
        <div className="space-y-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-10 w-full" />
            <div className="grid grid-cols-3 gap-4">
                <Skeleton className="h-64 w-full col-span-3" />
            </div>
        </div>
    )
  }

  const roomAttendanceLog = Object.entries(attendanceLog).reduce((acc, [date, records]) => {
    const roomRecords = records.filter(rec => rec.roomId === roomId);
    if (roomRecords.length > 0) {
      acc[date] = roomRecords;
    }
    return acc;
  }, {} as typeof attendanceLog);

  return (
    <div className="space-y-6">
       <Button variant="outline" onClick={() => router.push('/dashboard')}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{room.name}</h1>
          <p className="text-muted-foreground">
            Manage users, attendance, and scanning for this room.
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add User to Room
        </Button>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users"><Users className="mr-2"/>Users</TabsTrigger>
          <TabsTrigger value="attendance"><Calendar className="mr-2"/>Attendance</TabsTrigger>
          <TabsTrigger value="scan"><ScanLine className="mr-2"/>Scan QR</TabsTrigger>
        </TabsList>
        <TabsContent value="users" className="mt-4">
            <UserTable users={roomUsers} />
        </TabsContent>
        <TabsContent value="attendance" className="mt-4">
            <AttendanceLog attendanceLog={roomAttendanceLog} />
        </TabsContent>
        <TabsContent value="scan" className="mt-4">
            <QrScanner onScan={(data) => logAttendance(data, roomId as string)} />
        </TabsContent>
      </Tabs>

      <UserForm
        user={null}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onFinished={() => {}}
        defaultRoomId={roomId as string}
      />
    </div>
  );
}
