"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RoomTable } from "@/components/room-table";
import { RoomForm } from "@/components/room-form";
import { PlusCircle } from "lucide-react";

export default function RoomsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Room Management</h1>
          <p className="text-muted-foreground">
            Create and manage rooms for attendance tracking.
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Room
        </Button>
      </div>
      
      <RoomTable />

      <RoomForm
        room={null}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onFinished={() => {}}
      />
    </div>
  );
}
