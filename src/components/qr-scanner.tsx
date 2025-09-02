"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScanLine, Video, VideoOff, CheckCircle2, Upload } from "lucide-react";
import { useApp } from "@/components/providers";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import jsQR from "jsqr";

export function QrScanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { logAttendance } = useApp();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  
  const handleScan = useCallback(async (data: string) => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
        const result = await logAttendance(data);
        if(result.success) {
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 1500); 
            toast({
                title: 'Scan Successful',
                description: `${result.user?.firstName} ${result.user?.lastName} has been logged.`,
            });
        } else {
            if (result.message !== "User already logged in today.") {
              toast({
                  variant: 'destructive',
                  title: 'Log Failed',
                  description: result.message || "An unknown error occurred.",
              });
            }
        }
    } catch(e) {
        toast({
            variant: 'destructive',
            title: 'Scan Error',
            description: "Invalid QR code data.",
        });
    }

    setTimeout(() => setIsProcessing(false), 2000); // Cooldown period
  }, [isProcessing, logAttendance, toast]);

  const tick = useCallback(() => {
    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      if (ctx) {
        canvas.height = video.videoHeight;
        canvas.width = video.videoWidth;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });

        if (code) {
          handleScan(code.data);
        }
      }
    }
  }, [handleScan]);

  useEffect(() => {
    let animationFrameId: number;

    const scanLoop = () => {
        if (isCameraOn && !isProcessing) {
            tick();
        }
        animationFrameId = requestAnimationFrame(scanLoop);
    }

    animationFrameId = requestAnimationFrame(scanLoop);

    return () => {
        cancelAnimationFrame(animationFrameId);
    }
  }, [isCameraOn, tick, isProcessing]);

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

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            if (canvasRef.current) {
                const canvas = canvasRef.current;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0);
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const code = jsQR(imageData.data, imageData.width, imageData.height);
                    if (code) {
                        handleScan(code.data);
                    } else {
                        toast({
                            variant: 'destructive',
                            title: 'Scan Failed',
                            description: 'No QR code found in the uploaded image.',
                        });
                    }
                }
            }
        };
        img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
    // Reset file input to allow uploading the same file again
    event.target.value = '';
  };


  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ScanLine className="h-6 w-6" />
          QR Code Scanner
        </CardTitle>
        <CardDescription>
          Point the camera at a user's QR code or upload an image to log their attendance.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative aspect-video w-full bg-muted rounded-lg overflow-hidden border">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={cn("h-full w-full object-cover", { 'hidden': !isCameraOn })}
          />
           <canvas ref={canvasRef} className="hidden" />
          {!isCameraOn && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                <VideoOff className="h-16 w-16 mb-4"/>
                <p>Camera is off</p>
            </div>
          )}
          {showSuccess && (
             <div className="absolute inset-0 bg-green-500/30 flex items-center justify-center">
                <div className="bg-white/90 rounded-full p-4">
                    <CheckCircle2 className="h-24 w-24 text-green-600 animate-pulse"/>
                </div>
             </div>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={handleToggleCamera} variant="outline" className="flex-1">
                {isCameraOn ? <VideoOff className="mr-2 h-4 w-4"/> : <Video className="mr-2 h-4 w-4"/>}
                {isCameraOn ? 'Turn Off Camera' : 'Turn On Camera'}
            </Button>
             <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />
            <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="flex-1">
                <Upload className="mr-2 h-4 w-4" />
                Upload QR Code
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}
