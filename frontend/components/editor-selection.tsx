"use client"

import type React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Code, FileText, LayoutGrid, PenTool, Presentation, Table } from "lucide-react";
import { motion } from "framer-motion";
import { AnimatedBackground } from "@/components/animated-background";
import { getRoomState, storeEditorSelection } from "@/lib/dev-storage";

interface EditorSelectionProps {
  roomId: string;
  onEditorSelected?: (editorType: string) => void;
}

type EditorType = {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
};

const editorTypes: EditorType[] = [
  {
    id: "code",
    name: "Code Editor",
    description: "Write and collaborate on code",
    icon: Code,
  },
  {
    id: "word",
    name: "Word Processor",
    description: "Create and edit documents",
    icon: FileText,
  },
  {
    id: "presentation",
    name: "Presentation",
    description: "Build slides and presentations",
    icon: Presentation,
  },
  {
    id: "spreadsheet",
    name: "Spreadsheet",
    description: "Work with data and calculations",
    icon: Table,
  },
  {
    id: "freeform",
    name: "Freeform Text",
    description: "Open canvas for notes and ideas",
    icon: PenTool,
  },
  {
    id: "custom",
    name: "Custom Editor",
    description: "Create your own editor type",
    icon: LayoutGrid,
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export function EditorSelection({ roomId, onEditorSelected }: EditorSelectionProps) {
  const router = useRouter();
  const [roomKey, setRoomKey] = useState<string>("");
  const [roomName, setRoomName] = useState<string>("");
  const [lastEditorType, setLastEditorType] = useState<string | null>(null);
  
  // Get room key and last editor type from localStorage or dev-storage
  useEffect(() => {
    // First try to get room info from localStorage
    const storedRoom = localStorage.getItem('currentRoom');
    if (storedRoom) {
      try {
        const roomData = JSON.parse(storedRoom);
        if (roomData.roomKey) {
          setRoomKey(roomData.roomKey);
        }
        if (roomData.name) {
          setRoomName(roomData.name);
        }
      } catch (e) {
        console.error('Error parsing room data:', e);
      }
    }
    
    // Get last editor type from dev-storage
    const roomState = getRoomState(roomId);
    if (roomState && roomState.lastEditorType) {
      console.log(`Found last editor type for room ${roomId}: ${roomState.lastEditorType}`);
      setLastEditorType(roomState.lastEditorType);
    }
  }, [roomId]);

  const handleSelectEditor = (editorType: string) => {
    // Store the selected editor type
    storeEditorSelection(roomId, 'lastSelected', { 
      editorType,
      timestamp: new Date().toISOString()
    });
    console.log(`Stored editor selection for room ${roomId}: ${editorType}`);
    
    // If an onEditorSelected callback is provided, use it
    if (onEditorSelected) {
      onEditorSelected(editorType);
    } else {
      // Otherwise, navigate directly
      router.push(`/room/${roomId}/editor/${editorType}`);
    }
  };

  // Group editors into rows of 3
  const row1 = editorTypes.slice(0, 3);
  const row2 = editorTypes.slice(3, 6);

  return (
    <div className="flex-1 relative overflow-auto">
      <AnimatedBackground />
      <div className="container mx-auto max-w-5xl py-12 px-4 z-10 relative">
        <div className="mb-8 text-center">
          <motion.h1
            className="text-4xl font-bold mb-2"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Select an Editor
          </motion.h1>
          <motion.p
            className="text-muted-foreground text-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {roomName && <span className="font-medium">{roomName} - </span>}
            Room Key: <span className="font-medium">{roomKey || "Unknown"}</span>
          </motion.p>
          
          {lastEditorType && (
            <motion.div
              className="mt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Button 
                variant="outline" 
                className="bg-primary/10 hover:bg-primary/20"
                onClick={() => handleSelectEditor(lastEditorType)}
              >
                Return to {editorTypes.find(e => e.id === lastEditorType)?.name || lastEditorType} Editor
              </Button>
            </motion.div>
          )}
        </div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {/* First row */}
          {row1.map((editor) => (
            <motion.div key={editor.id} variants={item}>
              <Card className="h-full cursor-pointer hover:border-primary/50 transition-all duration-300 backdrop-blur-sm bg-background/80 border-background/20">
                <CardHeader>
                  <div className="flex items-center justify-center h-14 w-14 rounded-lg bg-primary/10 mb-2">
                    <editor.icon className="h-7 w-7 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{editor.name}</CardTitle>
                  <CardDescription className="text-base">{editor.description}</CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button className="w-full text-base py-5" onClick={() => handleSelectEditor(editor.id)}>
                    Select
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}

          {/* Second row */}
          {row2.map((editor) => (
            <motion.div key={editor.id} variants={item}>
              <Card className="h-full cursor-pointer hover:border-primary/50 transition-all duration-300 backdrop-blur-sm bg-background/80 border-background/20">
                <CardHeader>
                  <div className="flex items-center justify-center h-14 w-14 rounded-lg bg-primary/10 mb-2">
                    <editor.icon className="h-7 w-7 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{editor.name}</CardTitle>
                  <CardDescription className="text-base">{editor.description}</CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button className="w-full text-base py-5" onClick={() => handleSelectEditor(editor.id)}>
                    Select
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
