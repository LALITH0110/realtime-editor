"use client"

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppSidebar } from '@/components/app-sidebar';
import { EditorSelection } from '@/components/editor-selection';
import { storeRoomState, getRoomState, getRoomDocuments } from '@/lib/dev-storage';

interface EditorSelectionPageProps {
  params: Promise<{
    roomId: string;
  }>;
}

export default function EditorSelectionPage({ params }: EditorSelectionPageProps) {
  const router = useRouter();
  const [roomId, setRoomId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [showSelection, setShowSelection] = useState(false);
  
  // Resolve params first
  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params;
      setRoomId(resolvedParams.roomId);
    };
    resolveParams();
  }, [params]);
  
  // Check for existing room state and documents when the room ID is available
  useEffect(() => {
    if (!roomId) return;
    
    const checkRoomState = async () => {
      try {
        setIsLoading(true);
        console.log(`Select page: Checking for documents in room ${roomId}...`);
        
        // Check multiple storage locations for documents
        // 1. Direct localStorage check
        const directKey = `direct_room_${roomId}_documents`;
        const directData = localStorage.getItem(directKey);
        let documents = [];
        
        if (directData) {
          try {
            const parsed = JSON.parse(directData);
            if (parsed && parsed.length > 0) {
              documents = parsed;
              console.log(`Select page: Found ${documents.length} documents in direct localStorage.`);
            }
          } catch (e) {
            console.error('Error parsing documents from direct localStorage:', e);
          }
        }
        
        // 2. If no documents found in direct storage, use the robust function
        if (documents.length === 0) {
          documents = getRoomDocuments(roomId);
          console.log(`Select page: Found ${documents.length} documents using getRoomDocuments.`);
        }
        
        if (documents.length > 0) {
          const editorType = documents[0].type;
          console.log(`Select page: Found documents. Redirecting to editor: ${editorType}`);
          
          // Ensure the room state is updated with this editor type
          storeRoomState(roomId, { 
            ...getRoomState(roomId),
            lastEditorType: editorType,
            hasDocuments: true,
            documentCount: documents.length,
            lastUpdated: new Date().toISOString(),
          });
          
          router.push(`/room/${roomId}/editor/${editorType}`);
          return;
        }
        
        // 3. Check room state for last editor type
        const roomState = getRoomState(roomId);
        if (roomState && roomState.lastEditorType) {
          console.log(`Select page: No documents, but found last editor type: ${roomState.lastEditorType}`);
          
          // If we have a last editor type, redirect to that editor
          router.push(`/room/${roomId}/editor/${roomState.lastEditorType}`);
          return;
        }

        // If no documents or last editor type are found, show the selection screen
        console.log(`Select page: No documents or last editor type found for room ${roomId}. Showing selection.`);
        setShowSelection(true);

      } catch (error) {
        console.error('Error checking room state on select page:', error);
        setShowSelection(true); // Show selection on error
      } finally {
        setIsLoading(false);
      }
    };
    
    checkRoomState();
  }, [roomId, router]);
  
  // Handler for when an editor is selected
  const handleEditorSelected = (editorType: string) => {
    console.log(`Editor selected: ${editorType} for room ${roomId}`);
    
    // Store the selected editor type in room state
    storeRoomState(roomId, { 
      lastEditorType: editorType,
      lastAccessed: new Date().toISOString()
    });
    
    // Navigate to the editor
    router.push(`/room/${roomId}/editor/${editorType}`);
  };
  
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg">Loading room...</p>
        </div>
      </div>
    );
  }
  
  if (!showSelection) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg">Redirecting to editor...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex h-screen">
      <AppSidebar defaultOpen={false} />
      <div className="flex-1">
        <EditorSelection roomId={roomId} onEditorSelected={handleEditorSelected} />
      </div>
    </div>
  );
}

