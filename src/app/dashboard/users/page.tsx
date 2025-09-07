
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { UserTable } from "@/components/user-table";
import { UserForm } from "@/components/user-form";
import { PlusCircle, RefreshCw, Loader2 } from "lucide-react";
import { useApp } from "@/components/providers";
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

export default function AllUsersPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { users, refreshAllQrCodes } = useApp();

  const handleRefresh = async () => {
    setIsAlertOpen(false);
    setIsRefreshing(true);
    await refreshAllQrCodes();
    setIsRefreshing(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">All Users</h1>
          <p className="text-muted-foreground">
            Manage all registered users across all rooms.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsAlertOpen(true)} disabled={isRefreshing}>
            {isRefreshing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Refresh All QR Codes
          </Button>
          <Button onClick={() => setIsFormOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>
      </div>
      
      <UserTable users={users} showActions={false} />

      <UserForm
        user={null}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onFinished={() => {}}
      />

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will regenerate the QR code for every user in the system.
              This action cannot be undone, and old QR codes will no longer be valid.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRefresh}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
