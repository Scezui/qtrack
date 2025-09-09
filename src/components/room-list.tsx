
"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, School, User, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { useApp } from "@/components/providers";
import type { Room } from "@/lib/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface RoomListProps {
  onEdit: (room: Room) => void;
  onDelete: (room: Room) => void;
}

export function RoomList({ onEdit, onDelete }: RoomListProps) {
  const { rooms, users } = useApp();
  const router = useRouter();

  const roomUserCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    users.forEach(user => {
        if (user.roomId) {
            counts[user.roomId] = (counts[user.roomId] || 0) + 1;
        }
    });
    return counts;
  }, [users]);

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
            <CardHeader className="flex flex-row items-start justify-between">
                <div>
                    <CardTitle>{room.name}</CardTitle>
                    {room.teacher && (
                    <CardDescription className="flex items-center pt-2">
                        <User className="mr-2 h-4 w-4" />
                        {room.teacher}
                    </CardDescription>
                    )}
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <span className="sr-only">Open menu</span>
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(room)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        <span>Edit</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDelete(room)} className="text-destructive focus:text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Delete</span>
                    </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </CardHeader>
            <CardContent>
                <div className="text-sm text-muted-foreground">
                    {roomUserCounts[room.id] || 0} user(s) assigned.
                </div>
            </CardContent>
          <CardFooter className="mt-auto">
            <Button onClick={() => handleRoomClick(room.id)} className="w-full">
              Enter Room
              <ArrowRight className="ml-auto h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
