"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"

export default function Home() {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (error) {
      console.error("Error accessing camera:", error)
    }
  }

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d")
      if (context) {
        context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height)
        const photoDataUrl = canvasRef.current.toDataURL("image/jpeg")
        setPhotoUrl(photoDataUrl)
      }
    }
  }

  const handleUpload = async () => {
    if (photoUrl) {
      const response = await fetch(photoUrl)
      const blob = await response.blob()
      const file = new File([blob], "photo.jpg", { type: "image/jpeg" })

      const formData = new FormData()
      formData.append("file", file)

      try {
        await fetch('/api/chat', {
          method: 'POST',
          body: formData
        })
        alert("Photo uploaded successfully!")
      } catch (error) {
        console.error("Error uploading photo:", error)
        alert("Failed to upload photo")
      }
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold mb-4">Photo Upload App</h1>
      <div className="space-y-4">
        <Button onClick={startCamera}>Open Camera</Button>
        <Button onClick={capturePhoto}>Take Photo</Button>
        <Button onClick={handleUpload} disabled={!photoUrl}>
          Upload Photo
        </Button>
      </div>
      <div className="mt-4 relative">
        <video ref={videoRef} autoPlay playsInline className="w-full max-w-sm" />
        <canvas ref={canvasRef} className="hidden" width="640" height="480" />
        {photoUrl && <img src={photoUrl || "/placeholder.svg"} alt="Captured" className="w-full max-w-sm mt-4" />}
      </div>
    </main>
  )
}

