
"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Pencil, Trash2, Download, ArrowUpDown, RefreshCw } from "lucide-react";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { useApp } from "@/components/providers";
import { UserForm } from "@/components/user-form";
import type { User, Room } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { QrCodeView } from "./qr-code-view";
import { Badge } from "./ui/badge";

type SortKey = "firstName" | "lastName" | "studentId" | "roomName";
type SortDirection = "asc" | "desc";

interface UserTableProps {
    users: User[];
    showActions?: boolean;
}

export function UserTable({ users: initialUsers, showActions = true }: UserTableProps) {
  const { deleteUser, users: allUsers, rooms, refreshUserQrCode } = useApp();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isQrViewOpen, setIsQrViewOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userToView, setUserToView] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const { toast } = useToast();
  
  const [sortKey, setSortKey] = useState<SortKey>("lastName");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const users = initialUsers || allUsers;

  const roomMap = useMemo(() => {
    return rooms.reduce((acc, room) => {
      acc[room.id] = room.name;
      return acc;
    }, {} as Record<string, string>);
  }, [rooms]);

  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => {
      let aValue: string | undefined;
      let bValue: string | undefined;

      if (sortKey === 'roomName') {
        aValue = a.roomId ? roomMap[a.roomId] : '';
        bValue = b.roomId ? roomMap[b.roomId] : '';
      } else {
        aValue = a[sortKey];
        bValue = b[sortKey];
      }
      
      const comparison = (aValue || '').trim().toLowerCase().localeCompare((bValue || '').trim().toLowerCase());

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [users, sortKey, sortDirection, roomMap]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
    setIsAlertOpen(true);
  }

  const handleViewQr = (user: User) => {
    setUserToView(user);
    setIsQrViewOpen(true);
  }

  const confirmDelete = () => {
    if (userToDelete) {
      deleteUser(userToDelete.id);
      toast({ title: "User Deleted", description: `User ${userToDelete.firstName} ${userToDelete.lastName} has been removed.` });
    }
    setIsAlertOpen(false);
    setUserToDelete(null);
  };

  const downloadQrCode = (user: User) => {
    const link = document.createElement("a");
    link.href = user.qrCode;
    link.download = `${user.studentId}-${user.lastName}-${user.firstName}-QRCode.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "QR Code Downloading", description: `The QR code for ${user.firstName} ${user.lastName} is downloading.` });
  };
  
  const handleRefreshQr = async (user: User) => {
    await refreshUserQrCode(user.id);
    toast({ title: "QR Code Refreshed", description: `The QR code for ${user.firstName} ${user.lastName} has been refreshed.` });
  };

  const SortableHeader = ({ sortKey: key, label }: { sortKey: SortKey, label: string }) => (
    <TableHead>
      <Button variant="ghost" onClick={() => handleSort(key)}>
        {label}
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    </TableHead>
  );

  return (
    <>
      <div className="rounded-lg border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">QR Code</TableHead>
              <SortableHeader sortKey="lastName" label="Last Name" />
              <SortableHeader sortKey="firstName" label="First Name" />
              <SortableHeader sortKey="studentId" label="Student ID" />
              <SortableHeader sortKey="roomName" label="Room" />
              {showActions && <TableHead className="text-right w-[100px]">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedUsers.length > 0 ? (
              sortedUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <button onClick={() => handleViewQr(user)} className="cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-md">
                      <Image
                        src={user.qrCode}
                        alt={`QR Code for ${user.firstName} ${user.lastName}`}
                        width={60}
                        height={60}
                        className="rounded-md"
                      />
                    </button>
                  </TableCell>
                  <TableCell className="font-medium">{user.lastName}</TableCell>
                  <TableCell>{user.firstName}</TableCell>
                  <TableCell>{user.studentId}</TableCell>
                  <TableCell>
                    {user.roomId && roomMap[user.roomId] ? (
                      <Badge variant="secondary">{roomMap[user.roomId]}</Badge>
                    ) : (
                      <span className="text-muted-foreground">Not Assigned</span>
                    )}
                  </TableCell>
                  {showActions && (
                    <TableCell className="text-right">
                       <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleViewQr(user)}>
                            View QR
                          </DropdownMenuItem>
                           <DropdownMenuItem onClick={() => downloadQrCode(user)}>
                            Download QR
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleRefreshQr(user)}>
                            Refresh QR
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleEdit(user)}>
                            Edit User
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteClick(user)} className="text-destructive focus:text-destructive">
                            Delete User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={showActions ? 6 : 5} className="h-24 text-center">
                  No users found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <UserForm
        user={selectedUser}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onFinished={() => setSelectedUser(null)}
        defaultRoomId={selectedUser?.roomId}
      />
      
      <QrCodeView
        user={userToView}
        open={isQrViewOpen}
        onOpenChange={setIsQrViewOpen}
      />

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user and their data.
            </AlertDialogDescription>
          </Header>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
