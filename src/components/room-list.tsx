
"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, School, User, Pencil, Trash2 } from "lucide-react";
import { useApp } from "@/components/providers";
import type { Room } from "@/lib/types";

interface RoomListProps {
  onEdit: (room: Room) => void;
  onDelete: (room: Room) => void;
}

export function RoomList({ onEdit, onDelete }: RoomListProps) {
  const { rooms } = useApp();
  const router = useRouter();

  const sortedRooms = useMemo(() => {
    return [...rooms].sort((a, b) => {
      return a.name.localeCompare(b.name);
    });
  }, [rooms]);

  const handleRoomClick = (roomId: string) => {
    router.push(`/dashboard/room/${roomId}`);
  };

  if (rooms.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 h-64 text-center">
            <School className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h2 className="text-xl font-semibold">No Rooms Yet</h2>
            <p className="text-muted-foreground">Get started by adding a new room.</p>
        </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {sortedRooms.map((room) => (
        <Card key={room.id} className="flex flex-col">
          <CardHeader>
            <CardTitle>{room.name}</CardTitle>
            {room.teacher ? (
              <CardDescription className="flex items-center pt-2">
                <User className="mr-2 h-4 w-4" />
                {room.teacher}
              </CardDescription>
            ) : (
                <CardDescription>Click to manage this room.</CardDescription>
            )}
          </CardHeader>
          <CardFooter className="mt-auto flex gap-2">
             <Button variant="outline" size="icon" onClick={() => onEdit(room)}>
                <Pencil className="h-4 w-4" />
                <span className="sr-only">Edit Room</span>
            </Button>
            <Button variant="outline" size="icon" className="text-destructive hover:text-destructive" onClick={() => onDelete(room)}>
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Delete Room</span>
            </Button>
            <Button onClick={() => handleRoomClick(room.id)} className="w-full">
              Enter Room
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
