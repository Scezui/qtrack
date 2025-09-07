
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RoomForm } from "@/components/room-form";
import { PlusCircle } from "lucide-react";
import { RoomList } from "@/components/room-list";
import type { Room } from "@/lib/types";

export default function DashboardPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);

  const handleAddRoomClick = () => {
    setEditingRoom(null);
    setIsFormOpen(true);
  }

  const handleEditRoom = (room: Room) => {
    setEditingRoom(room);
    setIsFormOpen(true);
  }

  const handleFormFinished = () => {
    setEditingRoom(null);
    setIsFormOpen(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Select a room to manage attendance and users.
          </p>
        </div>
        <Button onClick={handleAddRoomClick}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Room
        </Button>
      </div>
      
      <RoomList onEdit={handleEditRoom} />

      <RoomForm
        room={editingRoom}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onFinished={handleFormFinished}
      />
    </div>
  );
}
