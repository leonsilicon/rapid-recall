"use client";

import { useState, useRef, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { CameraIcon } from "lucide-react";
import imageResize from "image-resize";

function useUploadPhoto() {
  const [isLoading, startTransition] = useTransition();
  const [isSuccess, setIsSuccess] = useState(false);

  const action = (photoUrl: string) => {
    startTransition(async () => {
      const response = await fetch(photoUrl);
      const blob = await response.blob();
      const smallPhotoBlob = await imageResize(blob, {
        format: "jpg",
        outputType: "blob",
        width: 640,
      });
      const file = new File([smallPhotoBlob], "photo.jpg", {
        type: "image/jpeg",
      });
      const formData = new FormData();
      formData.append("file", file);

      const chatResponse = await fetch("/api/chat", {
        method: "POST",
        body: formData,
      });
      const text = await chatResponse.text();
      console.log(text);
      try {
        const data = JSON.parse(text);
        console.log(data);
        setIsSuccess(true);
      } catch (error) {
        console.error("Error parsing JSON:", error);
        setIsSuccess(false);
      }
    });
  };

  return {
    isLoading,
    isSuccess,
    action,
    reset: () => setIsSuccess(false),
  };
}

export default function Home() {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const uploadPhoto = useUploadPhoto();

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraEnabled(true);
    } catch (error) {
      console.error("Error accessing camera:", error);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      if (context) {
        context.drawImage(
          videoRef.current,
          0,
          0,
          canvasRef.current.width,
          canvasRef.current.height
        );
        const photoDataUrl = canvasRef.current.toDataURL("image/jpeg");
        setPhotoUrl(photoDataUrl);
      }
    }
  };

  const retakePhoto = () => {
    setPhotoUrl(null);
    uploadPhoto.reset();
    startCamera();
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold mb-4">Rapid Recall</h1>
      <p className="text-sm text-gray-500 mb-4">
        Generate a quiz shooter game from your notes
      </p>

      {uploadPhoto.isSuccess ? (
        <div className="space-y-4 text-center">
          <p className="text-green-600 font-medium">
            Quiz created successfully!
          </p>
          <Button onClick={retakePhoto}>Take New Photo</Button>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {!cameraEnabled && (
              <Button onClick={startCamera}>Open Camera</Button>
            )}
          </div>
          {photoUrl ? (
            <img
              src={photoUrl}
              alt="Captured"
              className="w-full max-w-sm mt-4"
            />
          ) : (
            <div className="mt-4 flex flex-col items-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full max-w-sm"
              />
              <canvas
                ref={canvasRef}
                className="hidden"
                width="640"
                height="480"
              />
              {cameraEnabled && (
                <div className="w-full max-w-sm bg-black flex justify-center items-center py-4">
                  <Button
                    onClick={capturePhoto}
                    className="w-16 h-16 rounded-full bg-white border-4 border-white flex items-center justify-center group"
                  >
                    <CameraIcon className="h-6 w-6 text-black group-hover:text-white transition-all" />
                  </Button>
                </div>
              )}
            </div>
          )}
          {photoUrl && (
            <div className="flex justify-center gap-4 mt-4">
              <Button onClick={retakePhoto}>Retake Photo</Button>
              <Button
                className="bg-blue-500"
                onClick={() => uploadPhoto.action(photoUrl)}
                disabled={!photoUrl || uploadPhoto.isLoading}
              >
                {uploadPhoto.isLoading ? "Creating quiz..." : "Create Quiz"}
              </Button>
            </div>
          )}
        </>
      )}
    </main>
  );
}
