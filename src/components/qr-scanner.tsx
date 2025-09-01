"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScanLine, Video, VideoOff, CheckCircle2 } from "lucide-react";
import { useApp } from "@/components/providers";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export function QrScanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const { users, logAttendance } = useApp();
  const { toast } = useToast();
  const [selectedUserToSimulate, setSelectedUserToSimulate] = useState<string>('');
  
  const startCamera = async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setIsCameraOn(true);
      } catch (err) {
        console.error("Error accessing camera: ", err);
        toast({
          variant: 'destructive',
          title: 'Camera Error',
          description: 'Could not access the camera. Please check permissions.',
        });
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraOn(false);
  };

  const handleToggleCamera = () => {
    if (isCameraOn) {
      stopCamera();
    } else {
      startCamera();
    }
  };

  useEffect(() => {
    return () => {
      stopCamera(); // Cleanup on component unmount
    };
  }, []);

  const handleSimulateScan = () => {
    if (!selectedUserToSimulate) {
      toast({
        variant: "destructive",
        title: "No User Selected",
        description: "Please select a user to simulate scanning.",
      });
      return;
    }
    
    const user = users.find(u => u.id === selectedUserToSimulate);
    if (user) {
        const scannedData = JSON.stringify({ name: user.name, studentId: user.studentId });
        const result = logAttendance(scannedData);
        if(result.success) {
            setScanResult(`Welcome, ${result.user?.name}!`);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 1500); // Animation duration
            toast({
                title: 'Scan Successful',
                description: `${result.user?.name} has been logged.`,
            });
        } else {
            toast({
                variant: 'destructive',
                title: 'Log Failed',
                description: result.message || "User already logged in today.",
            });
        }
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ScanLine className="h-6 w-6" />
          QR Code Scanner
        </CardTitle>
        <CardDescription>
          Point the camera at a user's QR code to log their attendance.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative aspect-video w-full bg-muted rounded-lg overflow-hidden border">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className={cn("h-full w-full object-cover", { 'hidden': !isCameraOn })}
          />
          {!isCameraOn && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                <VideoOff className="h-16 w-16 mb-4"/>
                <p>Camera is off</p>
            </div>
          )}
          {showSuccess && (
             <div className="absolute inset-0 bg-accent/30 flex items-center justify-center animate-pulse">
                <CheckCircle2 className="h-24 w-24 text-white/90"/>
             </div>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={handleToggleCamera} variant="outline" className="flex-1">
                {isCameraOn ? <VideoOff className="mr-2 h-4 w-4"/> : <Video className="mr-2 h-4 w-4"/>}
                {isCameraOn ? 'Turn Off Camera' : 'Turn On Camera'}
            </Button>
        </div>

        <div className="p-4 border-t">
          <Label className="font-semibold text-muted-foreground">Scan Simulation</Label>
          <p className="text-sm text-muted-foreground mb-2">For testing purposes, select a user and simulate a scan.</p>
          <div className="flex flex-col sm:flex-row gap-2">
            <Select onValueChange={setSelectedUserToSimulate} value={selectedUserToSimulate}>
                <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select a user to simulate" />
                </SelectTrigger>
                <SelectContent>
                    {users.map(user => (
                        <SelectItem key={user.id} value={user.id}>{user.name} ({user.studentId})</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Button onClick={handleSimulateScan} disabled={!selectedUserToSimulate}>
                <ScanLine className="mr-2 h-4 w-4" /> Simulate Scan
            </Button>
          </div>
        </div>

      </CardContent>
    </Card>
  );
}
