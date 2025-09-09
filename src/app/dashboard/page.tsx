
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RoomForm } from "@/components/room-form";
import { PlusCircle } from "lucide-react";
import { RoomList } from "@/components/room-list";
import type { Room } from "@/lib/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useApp } from "@/components/providers";

export default function DashboardPage() {
  const { deleteRoom } = useApp();
  const { toast } = useToast();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");

  const handleAddRoomClick = () => {
    setEditingRoom(null);
    setIsFormOpen(true);
  }

  const handleEditRoom = (room: Room) => {
    setEditingRoom(room);
    setIsFormOpen(true);
  }

  const handleDeleteClick = (room: Room) => {
    setRoomToDelete(room);
    setIsAlertOpen(true);
  }

  const handleFormFinished = () => {
    setEditingRoom(null);
    setIsFormOpen(false);
  }

  const handleAlertOpenChange = (open: boolean) => {
    if (!open) {
        setRoomToDelete(null);
        setDeleteConfirmationText("");
    }
    setIsAlertOpen(open);
  }

  const confirmDelete = () => {
    if (roomToDelete) {
      deleteRoom(roomToDelete.id);
      toast({ title: "Room Deleted", description: `Room ${roomToDelete.name} has been removed.` });
    }
    handleAlertOpenChange(false);
  };

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
      
      <RoomList onEdit={handleEditRoom} onDelete={handleDeleteClick} />

      <RoomForm
        room={editingRoom}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onFinished={handleFormFinished}
      />

       <AlertDialog open={isAlertOpen} onOpenChange={handleAlertOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the room and all its associated data. 
              To confirm, please type <strong>delete</strong> in the box below.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 my-2">
            <Label htmlFor="delete-confirm">Confirmation</Label>
            <Input
              id="delete-confirm"
              value={deleteConfirmationText}
              onChange={(e) => setDeleteConfirmationText(e.target.value)}
              placeholder="delete"
              autoComplete="off"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              disabled={deleteConfirmationText !== 'delete'}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
