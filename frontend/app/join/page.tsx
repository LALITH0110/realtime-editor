"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AnimatedBackground } from "@/components/animated-background"
import { KeyRound, Lock } from "lucide-react"
import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { roomHasPassword, getRoomDocuments, storeRoomState, storeRoomDocuments } from '@/lib/dev-storage'

export default function JoinRoomPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [roomKey, setRoomKey] = useState(searchParams.get('roomKey') || '')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [roomData, setRoomData] = useState<any>(null)
  const [isPasswordProtected, setIsPasswordProtected] = useState(false)
  const [showPasswordStep, setShowPasswordStep] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState<'roomKey' | 'password'>('roomKey')

  // Check if room exists and if it's password protected
  useEffect(() => {
    const checkRoom = async () => {
      if (roomKey && roomKey.length > 2) {
        try {
          setIsLoading(true);
          setError('');
          const response = await fetch(`/api/rooms/key/${roomKey}`);
          
          if (response.ok) {
            const data = await response.json();
            console.log('Room data:', data);
            setRoomData(data);
            
            // Set password protection based on actual room data
            // Check both possible field names
            const needsPassword = data.isPasswordProtected === true || data.passwordProtected === true;
            setIsPasswordProtected(needsPassword);
            console.log(`Room ${roomKey} password protection: ${needsPassword ? 'Yes' : 'No'}`);
            
            // Reset password step when checking a new room
            setShowPasswordStep(false);
            
            // Also force check with our test API
            try {
              // Use a direct fetch instead of the function to avoid dependency issues
              const testResponse = await fetch(`/api/test/password/${roomKey}`);
              if (testResponse.ok) {
                const testData = await testResponse.json();
                console.log(`Force check for room ${roomKey}:`, testData);
                
                // Update state based on the test API response
                const testNeedsPassword = testData.hasPassword === true;
                if (testNeedsPassword !== needsPassword) {
                  console.log(`Force check differs from API: ${testNeedsPassword} vs ${needsPassword}`);
                  setIsPasswordProtected(testNeedsPassword);
                }
              }
            } catch (err) {
              console.error('Error in force check during room check:', err);
            }
          } else {
            // Reset password protection if room not found
            setRoomData(null);
            setIsPasswordProtected(false);
            setShowPasswordStep(false);
            if (response.status === 404) {
              setError(`Room with key "${roomKey}" not found`);
            } else {
              setError('Error checking room');
            }
          }
        } catch (err) {
          console.error('Error checking room:', err);
          setError('Failed to check room');
        } finally {
          setIsLoading(false);
        }
      } else {
        // Reset password protection if room key is too short
        setRoomData(null);
        setIsPasswordProtected(false);
        setShowPasswordStep(false);
      }
    };
    
    checkRoom();
  }, [roomKey]);
  
  useEffect(() => {
    // Get username from localStorage if available
    const savedUsername = localStorage.getItem('username');
    if (savedUsername) {
      setUsername(savedUsername);
    }
  }, []);

  // Check if room is password protected when room key changes
  useEffect(() => {
    if (roomKey.length === 6) {
      const hasPassword = roomHasPassword(roomKey);
      console.log(`Checking if room ${roomKey} is password protected: ${hasPassword}`);
      setIsPasswordProtected(hasPassword);
    }
  }, [roomKey]);

  const handleRoomKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomKey || !username) {
      setError('Room key and username are required');
      return;
    }

    if (roomKey.length !== 6) {
      setError('Room key must be 6 characters');
      return;
    }

    // Check if the room is password protected
    const hasPassword = roomHasPassword(roomKey);
    console.log(`Room ${roomKey} password protected: ${hasPassword}`);
    setIsPasswordProtected(hasPassword);

    if (hasPassword) {
      // If room is password protected, move to password step
      setStep('password');
    } else {
      // If not password protected, join the room directly
      handleJoinRoom();
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('Password is required');
      return;
    }
    
    handleJoinRoom();
  };

  const handleJoinRoom = async () => {
    setError('');
    setIsLoading(true);

    try {
      console.log(`Joining room ${roomKey} with username ${username}${isPasswordProtected ? ' and password' : ''}`);
      
      const response = await fetch('/api/rooms/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomKey,
          username,
          password: isPasswordProtected ? password : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to join room: ${response.status}`);
      }

      const room = await response.json();
      console.log('Room joined successfully:', room);
      
      // Store username and current room info
      localStorage.setItem('username', username);
      localStorage.setItem('currentRoom', JSON.stringify(room));
      
      // Fetch documents from the database first
      console.log(`Fetching documents from database for room ${room.id}...`);
      
      try {
        const docsResponse = await fetch(`/api/rooms/${room.id}/documents`);
        if (docsResponse.ok) {
          const documents = await docsResponse.json();
          console.log(`Found ${documents.length} documents in database for room ${room.id}`);
          
          if (documents.length > 0) {
            // Store documents locally for offline use
            storeRoomDocuments(room.id, documents);
            
            // Get the editor type from the first document
            const editorType = documents[0].type;
            console.log(`Documents found in database. Redirecting to editor with type: ${editorType}`);
            
            // Store the editor type in room state
            storeRoomState(room.id, { 
              lastEditorType: editorType,
              hasDocuments: true,
              documentCount: documents.length,
              lastAccessed: new Date().toISOString()
            });
            
            // Redirect directly to the editor
            router.push(`/room/${room.id}/editor/${editorType}`);
            return;
          }
        } else {
          console.log(`No documents found in database for room ${room.id}, status: ${docsResponse.status}`);
        }
      } catch (dbError) {
        console.error('Error fetching documents from database:', dbError);
      }
      
      // Fallback: Check localStorage for existing documents
      const documents = getRoomDocuments(room.id);
      console.log(`Found ${documents.length} documents in localStorage for room ${room.id}`);
      
      if (documents.length > 0) {
        // We have documents in localStorage, get the editor type from the first one
        const editorType = documents[0].type;
        console.log(`Documents found in localStorage. Redirecting to editor with type: ${editorType}`);
        
        // Store the editor type in room state
        storeRoomState(room.id, { 
          lastEditorType: editorType,
          hasDocuments: true,
          documentCount: documents.length,
          lastAccessed: new Date().toISOString()
        });
        
        // Redirect directly to the editor
        router.push(`/room/${room.id}/editor/${editorType}`);
      } else if (room.state && room.state.lastEditorType) {
        // No documents, but we have a last editor type
        console.log(`No documents, but found last editor type in state. Redirecting to: ${room.state.lastEditorType}`);
        router.push(`/room/${room.id}/editor/${room.state.lastEditorType}`);
      } else {
        // No documents or editor type, go to selection
        console.log('No documents or last editor type found. Proceeding to selection page.');
        router.push(`/room/${room.id}/select`);
      }
    } catch (error: any) {
      console.error('Error joining room:', error);
      setError(error.message || 'Failed to join room');
    } finally {
      setIsLoading(false);
    }
  };

  const goBackToInitialStep = () => {
    setShowPasswordStep(false);
    setPassword('');
    setError('');
  };

  // Function to force check if a room is password protected
  const forceCheckPassword = async () => {
    if (!roomKey || roomKey.length < 3) return;
    
    try {
      const response = await fetch(`/api/test/password/${roomKey}`);
      if (response.ok) {
        const data = await response.json();
        console.log(`Force check for room ${roomKey}:`, data);
        
        // Update state based on the test API response
        const needsPassword = data.hasPassword === true;
        setIsPasswordProtected(needsPassword);
        console.log(`Force check result: Room ${roomKey} needs password: ${needsPassword}`);
        
        // If we're already in the password step but the room doesn't need a password,
        // go back to the initial step
        if (showPasswordStep && !needsPassword) {
          setShowPasswordStep(false);
        }
      }
    } catch (err) {
      console.error('Error in force check:', err);
    }
  };

  // Add a button to trigger the force check in the debug UI
  const DebugForceCheckButton = () => (
    <button 
      type="button" 
      onClick={forceCheckPassword}
      className="bg-purple-800 text-white px-2 py-1 rounded text-xs"
    >
      Force Check
    </button>
  );

  return (
    <div className="flex h-screen">
      <AppSidebar />
      <div className="flex-1 relative flex items-center justify-center p-4">
        <AnimatedBackground />

        <Card className="w-full max-w-md shadow-lg z-10 backdrop-blur-sm bg-background/80 border-background/20">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center">Join Room</CardTitle>
            <CardDescription className="text-center text-lg">
              {step === 'roomKey' ? 'Enter room details to join an existing session' : `Enter password for room ${roomKey}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 px-6">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {/* Debug info - only visible in development */}
            {process.env.NODE_ENV === 'development' && roomKey && roomKey.length >= 3 && (
              <div className="bg-slate-900 p-2 rounded text-xs mb-4 overflow-auto max-h-24">
                <p>Room Key: {roomKey}</p>
                <p>Password Protected: {isPasswordProtected ? 'Yes' : 'No'}</p>
                <p>Show Password Step: {showPasswordStep ? 'Yes' : 'No'}</p>
                {roomData && (
                  <>
                    <p>isPasswordProtected: {roomData.isPasswordProtected ? 'Yes' : 'No'}</p>
                    <p>passwordProtected: {roomData.passwordProtected ? 'Yes' : 'No'}</p>
                    <p>Room Data: {JSON.stringify(roomData)}</p>
                  </>
                )}
                <div className="mt-2 flex gap-2">
                  <button 
                    type="button" 
                    onClick={() => {
                      setIsPasswordProtected(true);
                      console.log(`DEBUG: Forced password protection for room ${roomKey}`);
                    }}
                    className="bg-blue-800 text-white px-2 py-1 rounded text-xs"
                  >
                    Force Password
                  </button>
                  <button 
                    type="button" 
                    onClick={() => {
                      setIsPasswordProtected(false);
                      console.log(`DEBUG: Removed password protection for room ${roomKey}`);
                    }}
                    className="bg-red-800 text-white px-2 py-1 rounded text-xs"
                  >
                    Remove Password
                  </button>
                  <button 
                    type="button" 
                    onClick={async () => {
                      try {
                        const response = await fetch(`/api/test/password/${roomKey}`);
                        const data = await response.json();
                        console.log('TEST API Response:', data);
                        alert(`Room ${roomKey} has password: ${data.hasPassword}\nPassword: ${data.password || 'none'}`);
                      } catch (err) {
                        console.error('Error testing password:', err);
                      }
                    }}
                    className="bg-green-800 text-white px-2 py-1 rounded text-xs"
                  >
                    Test API
                  </button>
                  <button 
                    type="button" 
                    onClick={async () => {
                      try {
                        const password = prompt('Enter password to add to room:', 'password123');
                        if (!password) return;
                        
                        const response = await fetch(`/api/test/add-password/${roomKey}`, {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({ password }),
                        });
                        
                        const data = await response.json();
                        console.log('Add password response:', data);
                        alert(`Password "${data.password}" added to room ${roomKey}`);
                        
                        // Force refresh the room data
                        await forceCheckPassword();
                      } catch (err) {
                        console.error('Error adding password:', err);
                      }
                    }}
                    className="bg-yellow-800 text-white px-2 py-1 rounded text-xs"
                  >
                    Add Password
                  </button>
                  <DebugForceCheckButton />
                </div>
              </div>
            )}
            
            {step === 'roomKey' ? (
              <form onSubmit={handleRoomKeySubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="roomKey" className="text-base">
                    Room Key
                  </Label>
                  <div className="relative">
                    <Input
                      id="roomKey"
                      type="text"
                      value={roomKey}
                      onChange={(e) => setRoomKey(e.target.value.toUpperCase())}
                      placeholder="Enter 6-character room key"
                      className="pl-10 h-12 text-base bg-slate-800 border-slate-600 text-slate-100"
                      maxLength={6}
                      autoFocus
                    />
                    <KeyRound className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username" className="text-base">
                    Username
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    className="h-12 text-base bg-slate-800 border-slate-600 text-slate-100"
                  />
                </div>
                
                <div className="pt-2">
                  <Button
                    type="submit"
                    className="w-full h-12 text-base bg-blue-600 hover:bg-blue-700"
                    disabled={!roomKey || !username || isLoading}
                  >
                    {isLoading ? "Checking..." : "Continue"}
                  </Button>
                </div>
              </form>
            ) : (
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-base">
                    Room Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter room password"
                      className="pl-10 h-12 text-base bg-slate-800 border-slate-600 text-slate-100"
                      autoFocus
                    />
                    <Lock className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
                
                <div className="pt-2 flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 h-12 text-base"
                    onClick={goBackToInitialStep}
                    disabled={isLoading}
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 h-12 text-base bg-blue-600 hover:bg-blue-700"
                    disabled={!password || isLoading}
                  >
                    {isLoading ? "Joining..." : "Join Room"}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-3 px-6 pb-6">
            {step === 'roomKey' && (
              <Button variant="ghost" className="w-full h-12 text-base" onClick={() => router.push("/")}>
                Back to Home
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
