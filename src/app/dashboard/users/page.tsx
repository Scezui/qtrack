"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { UserTable } from "@/components/user-table";
import { UserForm } from "@/components/user-form";
import { PlusCircle } from "lucide-react";
import { useApp } from "@/components/providers";

export default function AllUsersPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { users } = useApp();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">All Users</h1>
          <p className="text-muted-foreground">
            Manage all registered users across all rooms.
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>
      
      <UserTable users={users} />

      <UserForm
        user={null}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onFinished={() => {}}
      />
    </div>
  );
}
