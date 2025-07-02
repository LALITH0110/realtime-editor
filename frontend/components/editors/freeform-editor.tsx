"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Eraser, Pencil, Square, Circle, Type, Image as ImageIcon } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface FreeformEditorProps {
  content: string
  onChange: (content: string, contentType?: string, binaryContent?: ArrayBuffer) => void
}

export function FreeformEditor({ content, onChange }: FreeformEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [tool, setTool] = useState("pencil")
  const [isDrawing, setIsDrawing] = useState(false)
  const [lastX, setLastX] = useState(0)
  const [lastY, setLastY] = useState(0)
  const [showImageDialog, setShowImageDialog] = useState(false)
  const [imageUrl, setImageUrl] = useState("")
  const [localImage, setLocalImage] = useState<File | null>(null)
  const [uploadMethod, setUploadMethod] = useState<'url' | 'local'>('url')
  const isInitialized = useRef(false)

  // Initialize canvas and load content if provided
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Resize canvas to fill container
    function resizeCanvas() {
      if (!canvas) return
      const container = canvas.parentElement
      if (!container) return
      canvas.width = container.clientWidth
      canvas.height = container.clientHeight
    }
    resizeCanvas()

    // Load content if available
    if (content && !isInitialized.current) {
      const img = new Image()
      img.onload = () => {
        ctx.drawImage(img, 0, 0)
        isInitialized.current = true
      }
      img.src = content
    }

    // Listen for window resize events
    window.addEventListener("resize", resizeCanvas)
    return () => window.removeEventListener("resize", resizeCanvas)
  }, [content])

  // Drawing functions
  function startDrawing(e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    setIsDrawing(true)
    setLastX(x)
    setLastY(y)
  }

  function draw(e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) {
    if (!isDrawing) return

    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    ctx.lineJoin = "round"
    ctx.lineCap = "round"
    ctx.lineWidth = 5

    if (tool === "pencil") {
      ctx.strokeStyle = "#fff"
      ctx.beginPath()
      ctx.moveTo(lastX, lastY)
      ctx.lineTo(x, y)
      ctx.stroke()
    } else if (tool === "eraser") {
      ctx.strokeStyle = "#121212" // Background color
      ctx.lineWidth = 20
      ctx.beginPath()
      ctx.moveTo(lastX, lastY)
      ctx.lineTo(x, y)
      ctx.stroke()
    } else if (tool === "square") {
      // For shapes, we'll implement a preview in the future
      ctx.strokeStyle = "#fff"
      ctx.strokeRect(lastX, lastY, x - lastX, y - lastY)
    } else if (tool === "circle") {
      ctx.strokeStyle = "#fff"
      const radius = Math.sqrt(Math.pow(x - lastX, 2) + Math.pow(y - lastY, 2))
      ctx.beginPath()
      ctx.arc(lastX, lastY, radius, 0, 2 * Math.PI)
      ctx.stroke()
    }

    setLastX(x)
    setLastY(y)
  }

  function stopDrawing() {
    if (!isDrawing) return
    setIsDrawing(false)

    // Save canvas content
    const canvas = canvasRef.current
    if (canvas) {
      const dataURL = canvas.toDataURL("image/png")
      onChange(dataURL, "image/png")
    }
  }

  const addImage = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    if (uploadMethod === 'url' && imageUrl) {
      const img = new Image();
      img.onload = () => {
        // Scale image to fit canvas while maintaining aspect ratio
        const scale = Math.min(
          canvas.width / img.width * 0.8, 
          canvas.height / img.height * 0.8
        );
        const width = img.width * scale;
        const height = img.height * scale;
        const x = (canvas.width - width) / 2;
        const y = (canvas.height - height) / 2;
        
        ctx.drawImage(img, x, y, width, height);
        setShowImageDialog(false);
        setImageUrl("");
        
        // Save canvas state
        const dataURL = canvas.toDataURL("image/png");
        onChange(dataURL, "image/png");
      };
      img.src = imageUrl;
    } else if (uploadMethod === 'local' && localImage) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === 'string') {
          const img = new Image();
          img.onload = () => {
            // Scale image to fit canvas while maintaining aspect ratio
            const scale = Math.min(
              canvas.width / img.width * 0.8, 
              canvas.height / img.height * 0.8
            );
            const width = img.width * scale;
            const height = img.height * scale;
            const x = (canvas.width - width) / 2;
            const y = (canvas.height - height) / 2;
            
            ctx.drawImage(img, x, y, width, height);
            setShowImageDialog(false);
            setLocalImage(null);
            
            // Save canvas state with content type
            const dataURL = canvas.toDataURL(localImage.type || "image/png");
            onChange(dataURL, localImage.type || "image/png");
            
            // Upload the image to backend
            const pathParts = window.location.pathname.split('/');
            const roomId = pathParts[2]; // Assuming /room/[roomId]/...
            const editorTypeIndex = pathParts.indexOf('editor');
            if (editorTypeIndex > 0 && pathParts[editorTypeIndex - 1] && roomId) {
              const documentId = pathParts[editorTypeIndex - 1];
              uploadImageToBackend(localImage, roomId, documentId);
            }
          };
          img.src = result;
        }
      };
      reader.readAsDataURL(localImage);
    }
  };

  const uploadImageToBackend = async (file: File, roomId: string, documentId: string) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`/api/rooms/${roomId}/documents/${documentId}/upload-image`, {
        method: 'PUT',
        body: formData
      });
      
      if (!response.ok) {
        console.error('Failed to upload image to backend');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Toolbar */}
      <div className="bg-[#1e1e1e] p-2 flex gap-2">
        <Button
          variant={tool === "pencil" ? "default" : "outline"}
          size="sm"
          onClick={() => setTool("pencil")}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant={tool === "eraser" ? "default" : "outline"}
          size="sm"
          onClick={() => setTool("eraser")}
        >
          <Eraser className="h-4 w-4" />
        </Button>
        <Button
          variant={tool === "square" ? "default" : "outline"}
          size="sm"
          onClick={() => setTool("square")}
        >
          <Square className="h-4 w-4" />
        </Button>
        <Button
          variant={tool === "circle" ? "default" : "outline"}
          size="sm"
          onClick={() => setTool("circle")}
        >
          <Circle className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowImageDialog(true)}
        >
          <ImageIcon className="h-4 w-4" />
        </Button>
      </div>

      {/* Canvas area */}
      <div className="flex-1 bg-[#121212] p-8 flex justify-center items-center">
        <canvas
          ref={canvasRef}
          className="border border-white/10 bg-black/30"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseOut={stopDrawing}
        />
      </div>

      {/* Image Dialog */}
      <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Insert Image</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex gap-4 mb-4">
              <Button 
                variant={uploadMethod === 'url' ? 'default' : 'outline'} 
                onClick={() => setUploadMethod('url')}
                className="flex-1"
              >
                Image URL
              </Button>
              <Button 
                variant={uploadMethod === 'local' ? 'default' : 'outline'} 
                onClick={() => setUploadMethod('local')}
                className="flex-1"
              >
                Upload Image
              </Button>
            </div>
            
            {uploadMethod === 'url' ? (
              <div className="grid gap-2">
                <Label htmlFor="image-url">Image URL</Label>
                <Input
                  id="image-url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            ) : (
              <div className="grid gap-2">
                <Label htmlFor="image-file">Upload Image</Label>
                <Input
                  id="image-file"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setLocalImage(e.target.files[0]);
                    }
                  }}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImageDialog(false)}>
              Cancel
            </Button>
            <Button onClick={addImage}>Insert</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
