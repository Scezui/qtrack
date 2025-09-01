"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { UserTable } from "@/components/user-table";
import { UserForm } from "@/components/user-form";
import { PlusCircle } from "lucide-react";

export default function DashboardPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">
            Manage all registered users and their QR codes.
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>
      
      <UserTable />

      <UserForm
        user={null}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onFinished={() => {}}
      />
    </div>
  );
}
