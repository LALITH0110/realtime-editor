"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import TextAlign from "@tiptap/extension-text-align"
import Image from "@tiptap/extension-image"
import TextStyle from "@tiptap/extension-text-style"
import FontSize from "@tiptap/extension-font-size"
import { Button } from "@/components/ui/button"
import {
  Bold,
  Italic,
  UnderlineIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Download,
  ImageIcon,
  History,
  Clock,
  Undo,
  Redo,
  ChevronDown,
  Eye,
  EyeOff,
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState, useEffect, useRef } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface WordEditorProps {
  content: string
  onChange: (content: string, contentType?: string, binaryContent?: ArrayBuffer) => void
}

type User = {
  id: string
  name: string
  avatar?: string
  color: string
}

type HistoryEntry = {
  id: string
  user: User
  timestamp: Date
  description: string
  content: string
}

export function WordEditor({ content, onChange }: WordEditorProps) {
  const [showImageDialog, setShowImageDialog] = useState(false)
  const [imageUrl, setImageUrl] = useState("")
  const [showHistoryDialog, setShowHistoryDialog] = useState(false)
  const [showContributions, setShowContributions] = useState(false)
  const [localImage, setLocalImage] = useState<File | null>(null)
  const [uploadMethod, setUploadMethod] = useState<'url' | 'local'>('url')
  const isInitialized = useRef(false)

  // Mock users data
  const [users] = useState<User[]>([
    { id: "user1", name: "John Doe", color: "#4f46e5" },
    { id: "user2", name: "Jane Smith", color: "#10b981" },
    { id: "user3", name: "Alex Johnson", color: "#8b5cf6" },
    { id: "user4", name: "You", color: "#f59e0b" },
  ])

  // Mock history data
  const [historyEntries] = useState<HistoryEntry[]>([
    {
      id: "1",
      user: users[0],
      timestamp: new Date(2025, 4, 22, 8, 15),
      description: "Added introduction paragraph",
      content: "<h1>Untitled</h1><p>This is the introduction paragraph added by John.</p>",
    },
    {
      id: "2",
      user: users[1],
      timestamp: new Date(2025, 4, 22, 8, 20),
      description: "Added second paragraph",
      content:
        "<h1>Untitled</h1><p>This is the introduction paragraph added by John.</p><p>This is the second paragraph added by Jane.</p>",
    },
    {
      id: "3",
      user: users[2],
      timestamp: new Date(2025, 4, 22, 8, 25),
      description: "Added bullet points",
      content:
        "<h1>Untitled</h1><p>This is the introduction paragraph added by John.</p><p>This is the second paragraph added by Jane.</p><ul><li>First point by Alex</li><li>Second point by Alex</li></ul>",
    },
    {
      id: "4",
      user: users[3],
      timestamp: new Date(2025, 4, 22, 8, 30),
      description: "Added conclusion",
      content:
        "<h1>Untitled</h1><p>This is the introduction paragraph added by John.</p><p>This is the second paragraph added by Jane.</p><ul><li>First point by Alex</li><li>Second point by Alex</li></ul><p>This is the conclusion added by you.</p>",
    },
  ])

  // Mock document with user contributions
  const [documentWithContributions, setDocumentWithContributions] = useState(`
    <h1>Untitled</h1>
    <p><span data-user="user1" style="background-color: rgba(79, 70, 229, 0.1); border-bottom: 2px solid #4f46e5;">This is the introduction paragraph added by John.</span></p>
    <p><span data-user="user2" style="background-color: rgba(16, 185, 129, 0.1); border-bottom: 2px solid #10b981;">This is the second paragraph added by Jane.</span></p>
    <ul>
      <li><span data-user="user3" style="background-color: rgba(139, 92, 246, 0.1); border-bottom: 2px solid #8b5cf6;">First point by Alex</span></li>
      <li><span data-user="user3" style="background-color: rgba(139, 92, 246, 0.1); border-bottom: 2px solid #8b5cf6;">Second point by Alex</span></li>
    </ul>
    <p><span data-user="user4" style="background-color: rgba(245, 158, 11, 0.1); border-bottom: 2px solid #f59e0b;">This is the conclusion added by you.</span></p>
  `)

  // Initialize with default content or provided content
  const initialContent = content || "<h1>Untitled</h1><p>Start typing here...</p>";

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
        paragraph: {
          HTMLAttributes: {
            class: "mb-4",
          },
        },
        bulletList: {
          HTMLAttributes: {
            class: "ml-4 list-disc",
          },
        },
        orderedList: {
          HTMLAttributes: {
            class: "ml-4 list-decimal",
          },
        },
      }),
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: "rounded-md max-w-full",
        },
      }),
      TextStyle,
      FontSize,
    ],
    content: initialContent,
    onUpdate: ({ editor }) => {
      // Only call onChange if the editor has been initialized
      if (isInitialized.current) {
        onChange(editor.getHTML())
      }
    },
    editorProps: {
      attributes: {
        class: "prose prose-invert max-w-none focus:outline-none min-h-[300px] p-8",
      },
    },
  })

  // Set the initialized flag once the editor is ready
  useEffect(() => {
    if (editor) {
      isInitialized.current = true;
    }
  }, [editor]);

  // Only update content from props if it's different from the editor content
  // and not caused by local edits
  useEffect(() => {
    if (editor && content) {
      // When content is provided and editor is not focused, update the editor content
      if (editor.getHTML() !== content && !editor.isFocused) {
        editor.commands.setContent(content);
      }
      
      // If this is the first content update, mark as initialized
      if (!isInitialized.current) {
        isInitialized.current = true;
      }
    }
  }, [content, editor]);

  // Handle contribution view toggle
  useEffect(() => {
    if (editor && showContributions) {
      editor.commands.setContent(documentWithContributions);
    } else if (editor && !showContributions && isInitialized.current) {
      editor.commands.setContent(content || initialContent);
    }
  }, [showContributions, editor, documentWithContributions]);

  if (!editor) {
    return null
  }

  const addImage = () => {
    if (uploadMethod === 'url' && imageUrl) {
      editor.chain().focus().setImage({ src: imageUrl }).run()
      setImageUrl("")
      setShowImageDialog(false)
    } else if (uploadMethod === 'local' && localImage) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === 'string') {
          editor.chain().focus().setImage({ src: result }).run()
          
          // Pass the content type along with the image data
          onChange(result, localImage.type);
          
          // Upload the image to the backend if we have a URL path with a document ID
          const pathParts = window.location.pathname.split('/');
          const editorTypeIndex = pathParts.indexOf('editor');
          if (editorTypeIndex > 0 && pathParts[editorTypeIndex - 1]) {
            const documentId = pathParts[editorTypeIndex - 1];
            uploadImageToBackend(localImage, documentId);
          }
        }
      };
      reader.readAsDataURL(localImage);
      setLocalImage(null);
      setShowImageDialog(false);
    }
  }
  
  const uploadImageToBackend = async (file: File, documentId: string) => {
    try {
      const roomId = window.location.pathname.split('/')[2]; // Extract roomId from URL
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

  const downloadDocument = () => {
    const content = editor.getHTML()
    const blob = new Blob([content], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "document.html"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const setFontSize = (size: number) => {
    editor.chain().focus().setFontSize(`${size}px`).run()
  }

  const toggleContributions = () => {
    setShowContributions(!showContributions)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="border-b p-2 flex flex-wrap gap-1 justify-between">
        <div className="flex flex-wrap gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={editor.isActive("bold") ? "bg-accent" : ""}
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={editor.isActive("italic") ? "bg-accent" : ""}
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={editor.isActive("underline") ? "bg-accent" : ""}
          >
            <UnderlineIcon className="h-4 w-4" />
          </Button>
          <div className="h-6 w-px bg-border mx-1" />

          {/* Font Size Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1">
                <span className="text-xs">Font Size</span>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {[12, 14, 16, 18, 20, 24, 30, 36, 48, 60, 72].map((size) => (
                <DropdownMenuItem key={size} onClick={() => setFontSize(size)}>
                  {size}px
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="h-6 w-px bg-border mx-1" />

          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            className={editor.isActive({ textAlign: "left" }) ? "bg-accent" : ""}
          >
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            className={editor.isActive({ textAlign: "center" }) ? "bg-accent" : ""}
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
            className={editor.isActive({ textAlign: "right" }) ? "bg-accent" : ""}
          >
            <AlignRight className="h-4 w-4" />
          </Button>

          <div className="h-6 w-px bg-border mx-1" />

          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={editor.isActive("bulletList") ? "bg-accent" : ""}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={editor.isActive("orderedList") ? "bg-accent" : ""}
          >
            <ListOrdered className="h-4 w-4" />
          </Button>

          <div className="h-6 w-px bg-border mx-1" />

          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={editor.isActive("heading", { level: 1 }) ? "bg-accent" : ""}
          >
            <Heading1 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={editor.isActive("heading", { level: 2 }) ? "bg-accent" : ""}
          >
            <Heading2 className="h-4 w-4" />
          </Button>

          <div className="h-6 w-px bg-border mx-1" />

          <Button variant="ghost" size="sm" onClick={() => setShowImageDialog(true)}>
            <ImageIcon className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
            <Undo className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
            <Redo className="h-4 w-4" />
          </Button>
          <div className="h-6 w-px bg-border mx-1" />
          <Button variant="ghost" size="sm" onClick={() => setShowHistoryDialog(true)}>
            <History className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={toggleContributions}>
            {showContributions ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="sm" onClick={downloadDocument}>
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-[#121212] p-8 flex justify-center">
        <div className="w-[8.5in] min-h-[11in] bg-[#1e1e1e] shadow-lg rounded-sm flex flex-col">
          <EditorContent editor={editor} className="prose prose-invert max-w-none outline-none focus:outline-none flex-1 p-8" />
        </div>
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

      {/* History Dialog */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Document History</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {historyEntries.map((entry) => (
                <div key={entry.id} className="flex items-start gap-2 p-2 rounded-md hover:bg-accent/50">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={entry.user.avatar} />
                    <AvatarFallback style={{ backgroundColor: entry.user.color }}>
                      {entry.user.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <span className="font-medium">{entry.user.name}</span>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{formatTime(entry.timestamp)}</span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{entry.description}</p>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            editor.commands.setContent(entry.content)
                            setShowHistoryDialog(false)
                          }}
                        >
                          <Clock className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Restore this version</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}
