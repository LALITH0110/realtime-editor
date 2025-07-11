"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CodeEditor } from "@/components/editors/code-editor"
import { WordEditor } from "@/components/editors/word-editor"
import { SpreadsheetEditor } from "@/components/editors/spreadsheet-editor"
import { PresentationEditor } from "@/components/editors/presentation-editor"
import { FreeformEditor } from "@/components/editors/freeform-editor"
import { CustomEditor } from "@/components/editors/custom-editor"
import {
  Plus,
  ArrowLeft,
  Users,
  Save,
  FileText,
  Code,
  Presentation,
  Table,
  PenTool,
  LayoutGrid,
  Pencil,
  Check,
  X,
  Download,
  Trash2,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useWebSocket } from "@/hooks/use-websocket"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { storeRoomDocuments, getRoomDocuments, debugRoomStorage, forceSaveDocument } from "@/lib/dev-storage"
import { getRoomState, storeRoomState } from "@/lib/dev-storage"

type Document = {
  id: string
  name: string
  type: string
  content: string
  contentType?: string
  binaryContent?: ArrayBuffer
}

type EditorType = {
  id: string
  name: string
  icon: React.ElementType
}

const editorTypes: EditorType[] = [
  { id: "word", name: "Word Document", icon: FileText },
  { id: "code", name: "Code Editor", icon: Code },
  { id: "presentation", name: "Presentation", icon: Presentation },
  { id: "spreadsheet", name: "Spreadsheet", icon: Table },
  { id: "freeform", name: "Freeform Canvas", icon: PenTool },
  { id: "custom", name: "Custom Editor", icon: LayoutGrid },
]

// Helper function to safely access browser storage
const isBrowser = typeof window !== 'undefined';

const safelyGetFromLocalStorage = (key: string): string | null => {
  if (!isBrowser) return null;
  try {
    return localStorage.getItem(key);
  } catch (e) {
    console.error(`Error reading from localStorage: ${e}`);
    return null;
  }
};

const safelySetToLocalStorage = (key: string, value: string): void => {
  if (!isBrowser) return;
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    console.error(`Error writing to localStorage: ${e}`);
  }
};

export function EditorContainer({
  roomId,
  editorType,
}: {
  roomId: string
  editorType: string
}) {
  const router = useRouter()
  const [documents, setDocuments] = useState<Document[]>([])
  const [activeTab, setActiveTab] = useState("")
  const [isSyncing, setIsSyncing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [connectedUsers, setConnectedUsers] = useState<string[]>(["John Doe", "Jane Smith", "Alex Johnson", "You"])
  const containerRef = useRef<HTMLDivElement>(null)
  const [editingTabId, setEditingTabId] = useState<string | null>(null)
  const [editingTabName, setEditingTabName] = useState("")
  const editInputRef = useRef<HTMLInputElement>(null)
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null)
  const [roomKey, setRoomKey] = useState<string>("")
  const [roomName, setRoomName] = useState<string>("")

  const { isConnected, lastMessage, sendMessage } = useWebSocket(`ws://localhost:8080/ws/room/${roomId}`)

  // Send JOIN message when WebSocket connects (only once)
  useEffect(() => {
    if (isConnected && sendMessage) {
      console.log(`🔗 WebSocket connected, sending JOIN message for room ${roomId}`);
      
      const joinMessage = {
        type: "JOIN",
        username: "User",
        roomId: roomId,
        timestamp: Date.now()
      };
      
      try {
        sendMessage(JSON.stringify(joinMessage));
        console.log(`📤 Sent JOIN message for room ${roomId}`);
      } catch (error) {
        console.warn(`⚠️ Failed to send JOIN message:`, error);
      }
    }
  }, [isConnected]); // Removed sendMessage and roomId from dependencies to prevent loops

  // Get room information from localStorage
  useEffect(() => {
    if (!isBrowser) return;
    
    const storedRoom = safelyGetFromLocalStorage('currentRoom');
    if (storedRoom) {
      try {
        const roomData = JSON.parse(storedRoom)
        if (roomData.roomKey) {
          setRoomKey(roomData.roomKey)
        }
        if (roomData.name) {
          setRoomName(roomData.name)
        }
      } catch (e) {
        console.error('Error parsing room data:', e)
      }
    }
  }, [roomId])

  // Ensure localStorage operations are only performed in the browser
  const storeRoomDocumentsWrapper = useCallback((roomId: string, documents: any[]) => {
    if (!isBrowser) return;
    storeRoomDocuments(roomId, documents);
  }, []);

  const getRoomDocumentsWrapper = useCallback((roomId: string) => {
    if (!isBrowser) return [];
    return getRoomDocuments(roomId);
  }, []);

  const forceSaveDocumentWrapper = useCallback((roomId: string, document: any) => {
    if (!isBrowser) return;
    forceSaveDocument(roomId, document);
  }, []);

  // Create default document function - memoized to prevent re-renders
  const createDefaultDocument = useCallback(async () => {
    if (!isBrowser) return;
    
    console.log(`Creating default document for room ${roomId} with editor type ${editorType}...`);
    
    // Set default content based on editor type
    let defaultContent = "";
    if (editorType === "word") {
      defaultContent = "<h1>Untitled</h1><p>Start typing here...</p>";
    } else if (editorType === "code") {
      defaultContent = "// Write your code here\n\n";
    } else if (editorType === "spreadsheet") {
      defaultContent = JSON.stringify({ data: [["", "", ""], ["", "", ""], ["", "", ""]] });
    } else if (editorType === "presentation") {
      defaultContent = JSON.stringify({ slides: [{ title: "Untitled Presentation", content: "Add your content here..." }] });
    } else if (editorType === "freeform") {
      defaultContent = JSON.stringify({ elements: [] });
    }
    
    // Create a default document locally first for immediate display
    const tempDocId = `temp-doc-${Math.random().toString(36).substring(2, 9)}`;
    const tempDoc: Document = {
      id: tempDocId,
      name: `New ${editorType.charAt(0).toUpperCase() + editorType.slice(1)}`,
      type: editorType.toLowerCase(),
      content: defaultContent,
    };
    
    // Update state immediately for better UX
    setDocuments([tempDoc]);
    setActiveTab(tempDoc.id);
    
    // Store it locally
    storeRoomDocumentsWrapper(roomId, [tempDoc]);
    
    // Try to create the document in the database (non-blocking)
    try {
      console.log(`Attempting to create document in database for room ${roomId}`);
      
      // Create an abort controller with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const createResponse = await fetch(`/api/rooms/${roomId}/documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: tempDoc.name,
          type: tempDoc.type,
          content: tempDoc.content,
        }),
        // Add a reasonable timeout
        signal: controller.signal,
      }).catch(error => {
        console.error(`Network error creating document in database for room ${roomId}:`, error);
        return null;
      });
      
      // Clear the timeout
      clearTimeout(timeoutId);

      if (createResponse && createResponse.ok) {
        const createdDoc = await createResponse.json();
        console.log(`Created document in database for room ${roomId}:`, createdDoc);
        
        // Convert to frontend format and replace the temporary document
        const persistedDoc: Document = {
          id: createdDoc.id,
          name: createdDoc.name,
          type: createdDoc.type.toLowerCase(),
          content: createdDoc.content || defaultContent,
        };

        setDocuments([persistedDoc]);
        setActiveTab(persistedDoc.id);
        
        // Update localStorage
        storeRoomDocumentsWrapper(roomId, [persistedDoc]);
        console.log(`Updated local storage with persistent document ID for room ${roomId}`);
      } else {
        console.warn(`Failed to create document in database for room ${roomId}, status: ${createResponse?.status || 'Network Error'}`);
        console.warn(`Using local document instead - changes will be saved locally only`);
        // Keep using the temporary document, it will be created in DB when user makes changes
      }
    } catch (error) {
      console.error(`Error creating document in database for room ${roomId}:`, error);
      // Local document is already set up, so we can continue using that
    }
  }, [roomId, editorType, storeRoomDocumentsWrapper]);

  // Define fetchDocuments function - memoized to prevent re-renders
  const fetchDocuments = useCallback(async (roomId: string) => {
    try {
      console.log(`Fetching documents for room ${roomId}...`);
      
      // Skip API calls during SSR to prevent hydration issues
      if (!isBrowser) {
        console.log('Skipping document fetch during SSR');
        return;
      }
      
      // First try to fetch from backend database
      try {
        const response = await fetch(`/api/rooms/${roomId}/documents`);
        if (response.ok) {
          const docs = await response.json();
          if (docs && docs.length > 0) {
            console.log(`Found ${docs.length} documents from database for room ${roomId}:`, docs);
            
            // Convert backend document format to frontend format
            const convertedDocs = docs.map((doc: any) => ({
              id: doc.id,
              name: doc.name,
              type: doc.type.toLowerCase(),
              content: doc.content || "",
              contentType: doc.contentType || null,
              // Note: binary content is handled separately through the /image endpoint
            }));
            
            // Process any binary content
            for (const doc of convertedDocs) {
              if (doc.contentType && doc.contentType.startsWith('image/')) {
                try {
                  // Fetch the binary image content
                  const imageResponse = await fetch(`/api/rooms/${roomId}/documents/${doc.id}/image`);
                  if (imageResponse.ok) {
                    // For images, we store the data URL in the content field for compatibility
                    const blob = await imageResponse.blob();
                    const reader = new FileReader();
                    reader.onload = function() {
                      doc.content = reader.result as string;
                      
                      // Update document in state
                      setDocuments(prevDocs => {
                        return prevDocs.map(d => d.id === doc.id ? {...d, content: doc.content} : d);
                      });
                      
                      // Update in localStorage
                      storeRoomDocumentsWrapper(roomId, convertedDocs);
                    };
                    reader.readAsDataURL(blob);
                  } else {
                    console.warn(`Failed to fetch image for document ${doc.id}`);
                  }
                } catch (err) {
                  console.error(`Error fetching image for document ${doc.id}:`, err);
                }
              }
            }
            
            setDocuments(convertedDocs);
            setActiveTab(convertedDocs[0].id);
            
            // Save to localStorage for offline use
            storeRoomDocumentsWrapper(roomId, convertedDocs);
            console.log(`Stored ${convertedDocs.length} documents from database to localStorage for room ${roomId}`);
            return;
          }
        } else {
          console.log(`No documents found in database for room ${roomId}, status: ${response.status}`);
        }
      } catch (error) {
        console.error(`Error fetching documents from database for room ${roomId}:`, error);
      }
      
      // Fallback: try to get documents from localStorage
      const storedDocs = getRoomDocumentsWrapper(roomId);
      if (storedDocs && storedDocs.length > 0) {
        console.log(`Found ${storedDocs.length} documents in localStorage for room ${roomId}:`, storedDocs);
        setDocuments(storedDocs);
        setActiveTab(storedDocs[0].id);
        return;
      }
      
      // If no documents exist, create a default one
      console.log(`No documents found for room ${roomId}, creating default document`);
      await createDefaultDocument();
    } catch (error) {
      console.error(`Error fetching documents for room ${roomId}:`, error);
      // Fall back to creating a default document
      await createDefaultDocument();
    }
  }, [roomId, storeRoomDocumentsWrapper, getRoomDocumentsWrapper, createDefaultDocument]);
  
  // Initialize with a default document based on the editor type
  useEffect(() => {
    // Only run this once when the component mounts
    let hasRun = false;
    
    const init = async () => {
      if (hasRun) return;
      hasRun = true;
      
      // First try to fetch existing documents for this room
      await fetchDocuments(roomId);
    };
    
    init();
    
          // Listen for storage events from other tabs with throttling
      if (isBrowser) {
        let storageUpdateTimeout: NodeJS.Timeout | null = null;
        
        const handleStorageEvent = (event: StorageEvent) => {
          if (!event || !event.key) return;
          
          // Prevent processing our own storage updates
          if (event.storageArea === sessionStorage) return;
          
          // Throttle storage updates to prevent excessive re-renders
          if (storageUpdateTimeout) {
            clearTimeout(storageUpdateTimeout);
          }
          
          storageUpdateTimeout = setTimeout(() => {
            if (event.key === `room_${roomId}_documents` && event.newValue) {
              try {
                const docs = JSON.parse(event.newValue);
                
                // Only update if the documents are actually different and newer
                setDocuments(prevDocs => {
                  const currentHash = JSON.stringify(prevDocs);
                  const newHash = JSON.stringify(docs);
                  
                  if (currentHash !== newHash) {
                    console.log(`Storage event: updating documents from another tab for room ${roomId}`);
                    return docs;
                  }
                  return prevDocs;
                });
              } catch (error) {
                console.error('Error parsing documents from storage event:', error);
              }
            }
          }, 500); // 500ms throttle
        };
        
        window.addEventListener('storage', handleStorageEvent);
        
        return () => {
          window.removeEventListener('storage', handleStorageEvent);
          if (storageUpdateTimeout) {
            clearTimeout(storageUpdateTimeout);
          }
        };
      }
  }, [roomId, editorType, fetchDocuments]);

  // Focus the input when editing starts
  useEffect(() => {
    if (editingTabId && editInputRef.current) {
      editInputRef.current.focus()
    }
  }, [editingTabId])

  // Handle WebSocket messages with simplified filtering
  useEffect(() => {
    if (lastMessage) {
      try {
        const data = JSON.parse(lastMessage.data)

        if (data.type === "CONNECTED") {
          console.log(`✅ Connected to room ${data.roomId}`);
        } else if (data.type === "DOCUMENT_UPDATE" || data.documentId) {
          // Only update if the content is actually different to prevent loops
          setDocuments((prev) => {
            const existingDoc = prev.find(doc => doc.id === data.documentId);
            if (!existingDoc || existingDoc.content === data.content) {
              return prev; // No change needed
            }
            
            console.log(`🔄 Received real-time update for document ${data.documentId}`);
            
            return prev.map((doc) => {
              if (doc.id === data.documentId) {
                // Handle both text and binary content
                if (data.contentType && data.contentType.startsWith('image/')) {
                  return { 
                    ...doc, 
                    content: data.content || doc.content, 
                    contentType: data.contentType,
                    binaryContent: data.binaryContent 
                  };
                } else {
                  return { ...doc, content: data.content };
                }
              }
              return doc;
            });
          });
        } else if (data.type === "USER_JOINED") {
          console.log(`👤 User ${data.username} joined`);
          setConnectedUsers((prev) => {
            if (!prev.includes(data.username)) {
              return [...prev, data.username];
            }
            return prev;
          });
        } else if (data.type === "USER_LEFT") {
          console.log(`👤 User ${data.username} left`);
          setConnectedUsers((prev) => prev.filter((user) => user !== data.username));
        }
      } catch (e) {
        console.error("Failed to parse WebSocket message:", e);
      }
    }
  }, [lastMessage]);

  // Helper function to check if a string is a valid UUID - memoized
  const isUuid = useCallback((id: string): boolean => {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  }, []);

  // Improved handleContentChange with better debouncing and WebSocket independence
  const handleContentChange = useCallback((documentId: string, content: string, contentType?: string, binaryContent?: ArrayBuffer) => {
    const timestamp = Date.now();
    
    // Immediately update the documents array in the component's state
    const updatedDocs = documents.map(doc => {
      if (doc.id === documentId) {
        // Check if this is an image (data URL)
        if (content && content.startsWith('data:image/')) {
          return { 
            ...doc, 
            content, 
            contentType: contentType || (content.match(/data:(.*?);/) ? content.match(/data:(.*?);/)![1] : 'image/png')
          };
        }
        return { ...doc, content, contentType, binaryContent };
      }
      return doc;
    });
    
    setDocuments(updatedDocs);
    
    // Show a syncing indicator in the UI
    setIsSyncing(true);

    // ALWAYS save to localStorage immediately (independent of WebSocket)
    storeRoomDocumentsWrapper(roomId, updatedDocs);
    
    // Also save the specific document directly to localStorage
    const updatedDoc = updatedDocs.find(doc => doc.id === documentId);
    if (updatedDoc) {
      forceSaveDocumentWrapper(roomId, updatedDoc);
    }

    // Clear any existing timer and set up a new one for auto-save to database
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    
    autoSaveTimerRef.current = setTimeout(async () => {
      // Auto-save to database after user stops typing for 2 seconds
      if (updatedDoc) {
        try {
          const isUuidResult = isUuid(documentId);
          
          if (isUuidResult) {
            // Update existing document in database
            console.log(`💾 Auto-saving document ${documentId} to database...`);
            
            const response = await fetch(`/api/rooms/${roomId}/documents/${documentId}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                name: updatedDoc.name,
                type: updatedDoc.type.toLowerCase(),
                content: content,
              }),
            });

            if (response.ok) {
              console.log(`✅ Successfully auto-saved document ${documentId} to database`);
              setLastSaved(new Date());
            } else {
              console.error(`❌ Failed to auto-save document ${documentId} to database, status: ${response.status}`);
            }
          } else {
            // Create new document in database
            console.log(`💾 Auto-creating document ${updatedDoc.name} in database...`);
            
            const response = await fetch(`/api/rooms/${roomId}/documents`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                name: updatedDoc.name,
                type: updatedDoc.type.toLowerCase(),
                content: content,
              }),
            });

            if (response.ok) {
              const createdDoc = await response.json();
              console.log(`✅ Successfully auto-created document ${updatedDoc.name} in database with ID ${createdDoc.id}`);
              
              // Update the document ID in local state
              const newUpdatedDocs = updatedDocs.map(doc => 
                doc.id === documentId ? { ...doc, id: createdDoc.id } : doc
              );
              setDocuments(newUpdatedDocs);
              storeRoomDocumentsWrapper(roomId, newUpdatedDocs);
              
              // Update active tab if it was the created document
              if (activeTab === documentId) {
                setActiveTab(createdDoc.id);
              }
              
              setLastSaved(new Date());
            } else {
              console.error(`❌ Failed to auto-create document ${updatedDoc.name} in database, status: ${response.status}`);
            }
          }
        } catch (error) {
          console.error(`💥 Error auto-saving document ${documentId}:`, error);
        }
      }
      
      setIsSyncing(false);
      console.log(`📄 Content for doc ${documentId} auto-saved.`);
    }, 2000); // Reduced back to 2 seconds

    // Send update to other users via WebSocket ONLY if connected (optional feature)
    if (isConnected && isUuid(documentId)) {
      try {
        const message = {
          documentId,
          content,
          contentType,
          binaryContent,
          timestamp,
          username: "You"
        };
        
        sendMessage(JSON.stringify(message));
        console.log(`🔄 Sent real-time update for document ${documentId}`);
      } catch (error) {
        console.warn(`⚠️ Failed to send real-time update (WebSocket issue):`, error);
        // Don't fail the save operation if WebSocket fails
      }
    }
  }, [documents, roomId, storeRoomDocumentsWrapper, forceSaveDocumentWrapper, activeTab, isConnected, sendMessage, isUuid]);

  const addNewDocument = useCallback(async (type: string) => {
    console.log(`Adding new ${type} document to room ${roomId}...`);
    
    // Try to create the document in the database first
    try {
      const response = await fetch(`/api/rooms/${roomId}/documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
          type: type.toLowerCase(),
          content: "",
        }),
      });

      if (response.ok) {
        const createdDoc = await response.json();
        console.log(`Created document in database for room ${roomId}:`, createdDoc);
        
        // Convert to frontend format
        const newDoc: Document = {
          id: createdDoc.id,
          name: createdDoc.name,
          type: createdDoc.type.toLowerCase(),
          content: createdDoc.content || "",
        };

        const updatedDocs = [...documents, newDoc];
        setDocuments(updatedDocs);
        setActiveTab(newDoc.id);
        
        // Save to localStorage for offline use
        storeRoomDocumentsWrapper(roomId, updatedDocs);
        console.log(`Added new document from database and saved locally for room ${roomId}`);
        return;
      } else {
        console.error(`Failed to create document in database, status: ${response.status}`);
      }
    } catch (error) {
      console.error(`Error creating document in database:`, error);
    }
    
    // Fallback: create document locally only
    const newDoc: Document = {
      id: `doc-${Math.random().toString(36).substring(2, 9)}`,
      name: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      type: type.toLowerCase(),
      content: "",
    };

    const updatedDocs = [...documents, newDoc];
    setDocuments(updatedDocs);
    setActiveTab(newDoc.id);
    
    // Save to localStorage
    storeRoomDocumentsWrapper(roomId, updatedDocs);
    console.log(`Added new document locally and saved to localStorage for room ${roomId}`);
  }, [roomId, documents, storeRoomDocumentsWrapper]);

  const deleteDocument = useCallback(async (docId: string) => {
    console.log(`Deleting document ${docId} from room ${roomId}...`);
    
    // Try to delete from database first if it's a UUID
    if (isUuid(docId)) {
      try {
        const response = await fetch(`/api/rooms/${roomId}/documents/${docId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          console.log(`Successfully deleted document ${docId} from database for room ${roomId}`);
        } else {
          console.error(`Failed to delete document ${docId} from database, status: ${response.status}`);
        }
      } catch (error) {
        console.error(`Error deleting document ${docId} from database:`, error);
        // Continue with local deletion
      }
    }
    
    // Always remove from local state
    const newDocs = documents.filter((doc) => doc.id !== docId);
    
    if (newDocs.length === 0) {
      // If no documents left, create a new default one
      await createDefaultDocument();
    } else {
      setDocuments(newDocs);
      
      // If the deleted document was active, switch to the first remaining document
      if (activeTab === docId) {
        setActiveTab(newDocs[0].id);
      }
      
      // Save updated documents to localStorage
      storeRoomDocumentsWrapper(roomId, newDocs);
      console.log(`Deleted document ${docId} and updated localStorage for room ${roomId}`);
    }
  }, [roomId, documents, isUuid, activeTab, createDefaultDocument, storeRoomDocumentsWrapper]);

  const startRenameDocument = useCallback((docId: string) => {
    const doc = documents.find((d) => d.id === docId)
    if (doc) {
      setEditingTabId(docId)
      setEditingTabName(doc.name)
    }
  }, [documents]);

  const saveRenameDocument = useCallback(() => {
    if (!editingTabId || !editingTabName.trim()) {
      setEditingTabId(null);
      setEditingTabName("");
      return;
    }

    // Create updated documents array
    const updatedDocs = documents.map((doc) => 
      (doc.id === editingTabId ? { ...doc, name: editingTabName.trim() } : doc)
    );
    
    // Update state
    setDocuments(updatedDocs);
    
    // Save to dev-storage
    storeRoomDocumentsWrapper(roomId, updatedDocs);
    console.log(`Renamed document and saved to dev-storage for room ${roomId}`);

    // In a real app, you would send this update to the server
    if (isConnected) {
      sendMessage(
        JSON.stringify({
          type: "DOCUMENT_RENAME",
          roomId,
          documentId: editingTabId,
          name: editingTabName.trim(),
        }),
      );
    }

    setEditingTabId(null);
    setEditingTabName("");
  }, [editingTabId, editingTabName, documents, roomId, storeRoomDocumentsWrapper, isConnected, sendMessage]);

  const cancelRenameDocument = useCallback(() => {
    setEditingTabId(null)
    setEditingTabName("")
  }, []);

  const handleRenameKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      saveRenameDocument()
    } else if (e.key === "Escape") {
      e.preventDefault()
      cancelRenameDocument()
    }
  }, [saveRenameDocument, cancelRenameDocument]);

  const downloadDocument = useCallback(() => {
    const activeDoc = documents.find((doc) => doc.id === activeTab)
    if (!activeDoc) return

    const content = activeDoc.content
    let fileType = "text/html"
    let fileExtension = "html"

    // Adjust based on document type
    if (activeDoc.type === "code") {
      fileType = "text/plain"
      fileExtension = "js"
    } else if (activeDoc.type === "spreadsheet" || activeDoc.type === "presentation") {
      fileType = "application/json"
      fileExtension = "json"
    }

    const blob = new Blob([content], { type: fileType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${activeDoc.name}.${fileExtension}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [documents, activeTab])

  const renderEditor = (document: Document) => {
    switch (document.type) {
      case "code":
        return (
          <CodeEditor content={document.content} onChange={(content) => handleContentChange(document.id, content, document.contentType, document.binaryContent)} />
        )
      case "word":
        return (
          <WordEditor content={document.content} onChange={(content) => handleContentChange(document.id, content, document.contentType, document.binaryContent)} />
        )
      case "spreadsheet":
        return (
          <SpreadsheetEditor
            content={document.content}
            onChange={(content) => handleContentChange(document.id, content, document.contentType, document.binaryContent)}
          />
        )
      case "presentation":
        return (
          <PresentationEditor
            content={document.content}
            onChange={(content) => handleContentChange(document.id, content, document.contentType, document.binaryContent)}
          />
        )
      case "freeform":
        return (
          <FreeformEditor
            content={document.content}
            onChange={(content) => handleContentChange(document.id, content, document.contentType, document.binaryContent)}
          />
        )
      default:
        return (
          <CustomEditor content={document.content} onChange={(content) => handleContentChange(document.id, content, document.contentType, document.binaryContent)} />
        )
    }
  }

  // Custom tab trigger that supports renaming
  const CustomTabTrigger = ({ doc }: { doc: Document }) => {
    const isEditing = editingTabId === doc.id

    if (isEditing) {
      return (
        <div className="flex items-center h-10 px-2 gap-1 border-b-2 border-transparent">
          <Input
            ref={editInputRef}
            value={editingTabName}
            onChange={(e) => setEditingTabName(e.target.value)}
            onKeyDown={handleRenameKeyDown}
            onBlur={saveRenameDocument}
            className="h-7 w-32 px-2 py-1 text-sm"
            autoFocus
          />
          <div className="flex items-center">
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={saveRenameDocument}>
              <Check className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={cancelRenameDocument}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )
    }

    return (
      <TabsTrigger value={doc.id} className="px-4 py-2 relative group">
        <span>{doc.name}</span>
        <div className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex">
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5"
            onClick={(e) => {
              e.stopPropagation()
              startRenameDocument(doc.id)
            }}
          >
            <Pencil className="h-3 w-3" />
          </Button>
          {documents.length > 1 && (
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 text-destructive"
              onClick={async (e) => {
                e.stopPropagation()
                await deleteDocument(doc.id)
              }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </TabsTrigger>
    )
  }

  // Remove conflicting auto-save functionality - handled in handleContentChange now

  const saveDocument = async () => {
    if (!isBrowser) return;
    
    setIsSaving(true);
    console.log("Manual save triggered...");
    
    let allSaved = true;
    const savedDocuments: Document[] = [];

    try {
      // Save each document to the database
      for (const doc of documents) {
        try {
          // Check if this is a UUID (database document) or a local ID
          const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(doc.id);
          
          if (isUuid) {
            // Update existing document in database
            console.log(`Updating document ${doc.id} in database...`);
            const response = await fetch(`/api/rooms/${roomId}/documents/${doc.id}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                name: doc.name,
                type: doc.type.toLowerCase(),
                content: doc.content,
              }),
            });

            if (response.ok) {
              const updatedDoc = await response.json();
              console.log(`Successfully updated document ${doc.id} in database`);
              savedDocuments.push({
                id: updatedDoc.id,
                name: updatedDoc.name,
                type: updatedDoc.type.toLowerCase(),
                content: updatedDoc.content || doc.content,
              });
            } else {
              console.error(`Failed to update document ${doc.id} in database, status: ${response.status}`);
              allSaved = false;
              savedDocuments.push(doc); // Keep original document
            }
          } else {
            // Create new document in database
            console.log(`Creating new document ${doc.name} in database...`);
            const response = await fetch(`/api/rooms/${roomId}/documents`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                name: doc.name,
                type: doc.type.toLowerCase(),
                content: doc.content,
              }),
            });

            if (response.ok) {
              const createdDoc = await response.json();
              console.log(`Successfully created document ${doc.name} in database with ID ${createdDoc.id}`);
              savedDocuments.push({
                id: createdDoc.id,
                name: createdDoc.name,
                type: createdDoc.type.toLowerCase(),
                content: createdDoc.content || doc.content,
              });
            } else {
              console.error(`Failed to create document ${doc.name} in database, status: ${response.status}`);
              allSaved = false;
              savedDocuments.push(doc); // Keep original document
            }
          }
        } catch (error) {
          console.error(`Error saving document ${doc.id}:`, error);
          allSaved = false;
          savedDocuments.push(doc); // Keep original document
        }
      }

      // Update local state with saved documents (including new IDs from database)
      if (savedDocuments.length > 0) {
        setDocuments(savedDocuments);
        
        // Update active tab if it changed
        const currentActiveDoc = savedDocuments.find(doc => 
          doc.id === activeTab || (documents.find(d => d.id === activeTab)?.name === doc.name)
        );
        if (currentActiveDoc && currentActiveDoc.id !== activeTab) {
          setActiveTab(currentActiveDoc.id);
        }
      }

      // Also save to localStorage as backup
      storeRoomDocumentsWrapper(roomId, savedDocuments);
      
      // Verify documents were saved
      if (allSaved) {
        console.log("All documents successfully saved to database!");
      } else {
        console.warn("Some documents failed to save to database, but are stored locally");
      }

      // Provide visual feedback in the UI
      setIsSyncing(false);
      setLastSaved(new Date());
      console.log("Save operation completed.");
    } catch (error) {
      console.error("Error during document save:", error);
      allSaved = false;
      
      // Emergency backup save to localStorage
      try {
        storeRoomDocumentsWrapper(roomId, documents);
        if (isBrowser) {
          const docData = JSON.stringify(documents);
          localStorage.setItem(`emergency_room_${roomId}_documents_${Date.now()}`, docData);
          console.log("Emergency backup save completed");
        }
      } catch (e) {
        console.error("Even emergency save failed:", e);
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Clean up when leaving the room
  useEffect(() => {
    return () => {
      // Clear any pending auto-save timer
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      
      // Save documents one last time before unmounting
      storeRoomDocumentsWrapper(roomId, documents);
      console.log(`Final save of documents for room ${roomId} before unmounting`);
    };
  }, [roomId, documents, storeRoomDocumentsWrapper]);

  const clearDocumentData = useCallback(() => {
    if (!isBrowser) return;
    
    localStorage.removeItem(`room_${roomId}_documents`);
    createDefaultDocument();
  }, [roomId, createDefaultDocument]);

  // Remove activeTab sharing to reduce cross-tab conflicts

  return (
    <div className="flex flex-col h-screen">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => router.push(`/room/${roomId}/select`)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex flex-col">
              <h1 className="text-xl font-semibold">{roomName || "Untitled Room"}</h1>
              <p className="text-sm text-muted-foreground">Room Key: {roomKey}</p>
            </div>
            <div className="flex items-center ml-4">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="flex items-center gap-1 cursor-help">
                      <Users className="h-3 w-3" />
                      <span>{connectedUsers.length} online</span>
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" align="start" className="max-w-xs">
                    <div className="space-y-1">
                      <p className="font-medium">Connected Users:</p>
                      <ul className="list-disc pl-4">
                        {connectedUsers.map((user, index) => (
                          <li key={index}>{user}</li>
                        ))}
                      </ul>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-sm text-muted-foreground">
              {isSyncing ? "Syncing..." : lastSaved ? `Last saved: ${lastSaved.toLocaleTimeString()}` : "All changes saved"}
            </div>
            <Button size="sm" className="gap-1" onClick={downloadDocument}>
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
            <Button size="sm" className="gap-1" onClick={saveDocument} disabled={isSaving}>
              <Save className="h-4 w-4" />
              {isSaving ? "Saving..." : "Save"}
            </Button>
            <Button size="sm" variant="outline" className="gap-1" onClick={clearDocumentData}>
              <Trash2 className="h-4 w-4" />
              Reset
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex items-center px-4 border-b">
            <TabsList className="h-10">
              {documents.map((doc) => (
                <CustomTabTrigger key={doc.id} doc={doc} />
              ))}
            </TabsList>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="ml-2 h-8 w-8">
                  <Plus className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Add New Document</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {editorTypes.map((type) => (
                  <DropdownMenuItem 
                    key={type.id} 
                    onClick={async () => await addNewDocument(type.id)} 
                    className="cursor-pointer"
                  >
                    <type.icon className="mr-2 h-4 w-4" />
                    <span>{type.name}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {documents.map((doc) => (
            <TabsContent key={doc.id} value={doc.id} className="flex-1 overflow-auto h-[calc(100vh-8.5rem)]">
              {renderEditor(doc)}
            </TabsContent>
          ))}
        </Tabs>
      </header>
    </div>
  )
}
