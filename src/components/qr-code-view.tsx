
"use client";

import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { User } from "@/lib/types";
import { Button } from "./ui/button";
import { Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface QrCodeViewProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QrCodeView({ user, open, onOpenChange }: QrCodeViewProps) {
  const { toast } = useToast();

  if (!user) return null;

  const downloadQrCode = () => {
    const link = document.createElement("a");
    link.href = user.qrCode;
    link.download = `${user.studentId}-${user.lastName}-${user.firstName}-QRCode.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "QR Code Downloading", description: `The QR code for ${user.firstName} ${user.lastName} is downloading.` });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>QR Code</DialogTitle>
          <DialogDescription>
            {`${user.firstName} ${user.lastName} (${user.studentId})`}
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center items-center p-4">
            <Image
                src={user.qrCode}
                alt={`QR Code for ${user.firstName} ${user.lastName}`}
                width={300}
                height={300}
                className="rounded-lg"
            />
        </div>
        <Button onClick={downloadQrCode} className="w-full">
            <Download className="mr-2 h-4 w-4" />
            Download QR Code
        </Button>
      </DialogContent>
    </Dialog>
  );
}
