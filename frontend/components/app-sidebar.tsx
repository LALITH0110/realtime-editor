"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Home, 
  LogIn, 
  Plus, 
  User, 
  UserPlus, 
  Menu, 
  X, 
  FileText, 
  RefreshCw, 
  Lock,
  AlertCircle,
  Loader2
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { authService, type Room } from "@/lib/auth-service"

type AppSidebarProps = {
  defaultOpen?: boolean
}

export function AppSidebar({ defaultOpen = false }: AppSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const { isAuthenticated, user, login, signup, logout, isLoading, error, clearError } = useAuth()
  
  // Room management
  const [rooms, setRooms] = useState<Room[]>([])
  const [isLoadingRooms, setIsLoadingRooms] = useState(false)
  const [roomsError, setRoomsError] = useState<string | null>(null)
  
  // Login form
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [showLoginDialog, setShowLoginDialog] = useState(false)
  const [loginFormError, setLoginFormError] = useState<string | null>(null)
  
  // Signup form
  const [signupEmail, setSignupEmail] = useState("")
  const [signupPassword, setSignupPassword] = useState("")
  const [signupUsername, setSignupUsername] = useState("")
  const [showSignupDialog, setShowSignupDialog] = useState(false)
  const [signupFormError, setSignupFormError] = useState<string | null>(null)

  // Always start with the sidebar closed
  useEffect(() => {
    setIsOpen(false)
  }, [])

  // Fetch user rooms when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchUserRooms()
    } else {
      setRooms([])
    }
  }, [isAuthenticated, user])

  const fetchUserRooms = async () => {
    if (!isAuthenticated) return
    
    setIsLoadingRooms(true)
    setRoomsError(null)
    
    try {
      const userRooms = await authService.getUserRooms()
      setRooms(userRooms)
      console.log(`Fetched ${userRooms.length} rooms for user ${user?.username}`)
    } catch (error) {
      console.error('Error fetching user rooms:', error)
      setRoomsError(error instanceof Error ? error.message : 'Failed to load rooms')
    } finally {
      setIsLoadingRooms(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginFormError(null)
    
    if (!loginEmail || !loginPassword) {
      setLoginFormError("Please fill in all fields")
      return
    }

    try {
      await login(loginEmail, loginPassword)
      setLoginEmail("")
      setLoginPassword("")
      setShowLoginDialog(false)
      setLoginFormError(null)
    } catch (error) {
      setLoginFormError(error instanceof Error ? error.message : 'Login failed')
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setSignupFormError(null)
    
    if (!signupUsername || !signupEmail || !signupPassword) {
      setSignupFormError("Please fill in all fields")
      return
    }

    if (signupPassword.length < 6) {
      setSignupFormError("Password must be at least 6 characters")
      return
    }

    try {
      await signup(signupUsername, signupEmail, signupPassword)
      setSignupEmail("")
      setSignupPassword("")
      setSignupUsername("")
      setShowSignupDialog(false)
      setSignupFormError(null)
    } catch (error) {
      setSignupFormError(error instanceof Error ? error.message : 'Signup failed')
    }
  }

  const handleLogout = () => {
    logout()
    setRooms([])
    router.push('/')
  }

  const navigateToRoom = async (roomId: string) => {
    // Find the room data
    const room = rooms.find(r => r.id === roomId)
    if (!room) {
      console.error(`Room ${roomId} not found in user rooms`)
      return
    }
    
    console.log(`Navigating to room:`, room)
    
    try {
      // For authenticated users navigating to their own rooms, we can assume they have access
      // But we still need to check if it's password protected and handle accordingly
      
      if (room.isPasswordProtected) {
        // For password-protected rooms, redirect to join page with room key
        console.log(`Room ${room.name} is password protected, redirecting to join page`)
        router.push(`/join?roomKey=${room.roomKey}`)
        closeSidebar()
        return
      }
      
      // For non-password protected rooms or rooms the user created, 
      // we can join directly via API to ensure proper permissions
      console.log(`Joining room ${room.name} directly...`)
      const joinResult = await authService.joinRoom(room.roomKey)
      
      if (joinResult) {
        // Store the room metadata
        localStorage.setItem('currentRoom', JSON.stringify(joinResult))
        
        // Navigate to the room
        router.push(`/room/${roomId}/select`)
        closeSidebar()
      } else {
        console.error(`Failed to join room ${room.name}`)
        // Fallback to join page
        router.push(`/join?roomKey=${room.roomKey}`)
        closeSidebar()
      }
    } catch (error) {
      console.error(`Error joining room ${room.name}:`, error)
      // Fallback to join page
      router.push(`/join?roomKey=${room.roomKey}`)
      closeSidebar()
    }
  }

  const toggleSidebar = () => {
    setIsOpen(!isOpen)
  }

  const closeSidebar = () => {
    setIsOpen(false)
  }

  const openLoginDialog = () => {
    setShowLoginDialog(true)
    setLoginFormError(null)
    clearError()
  }

  const openSignupDialog = () => {
    setShowSignupDialog(true)
    setSignupFormError(null)
    clearError()
  }

  // Show loading state during initial auth check
  if (isLoading) {
    return (
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-r">
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden" 
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <div 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-r transform transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">CollabEdge</h2>
            <Button variant="ghost" size="icon" onClick={closeSidebar}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-2">
              <div className="px-2 py-1">
                <span className="text-xs font-medium text-muted-foreground">Navigation</span>
              </div>
              <div className="mt-1 space-y-1">
                <button
                  className={`flex items-center gap-2 w-full p-2 rounded-md hover:bg-accent text-left ${
                    pathname === "/" ? "bg-accent" : ""
                  }`}
                  onClick={() => {
                    router.push("/")
                    closeSidebar()
                  }}
                >
                  <Home className="h-4 w-4" />
                  <span>Home</span>
                </button>
                <button
                  className={`flex items-center gap-2 w-full p-2 rounded-md hover:bg-accent text-left ${
                    pathname === "/create" ? "bg-accent" : ""
                  }`}
                  onClick={() => {
                    router.push("/create")
                    closeSidebar()
                  }}
                >
                  <Plus className="h-4 w-4" />
                  <span>Create Room</span>
                </button>
              </div>
            </div>

            {/* User Rooms Section */}
            {isAuthenticated && (
              <div className="p-2 border-t">
                <div className="flex items-center justify-between px-2 py-1">
                  <span className="text-xs font-medium text-muted-foreground">Your Rooms</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6"
                    onClick={fetchUserRooms}
                    disabled={isLoadingRooms}
                  >
                    <RefreshCw className={`h-3 w-3 ${isLoadingRooms ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
                
                <div className="mt-1 space-y-1">
                  {isLoadingRooms ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : roomsError ? (
                    <div className="p-2 text-xs text-red-500">
                      {roomsError}
                    </div>
                  ) : rooms.length === 0 ? (
                    <div className="p-2 text-xs text-muted-foreground">
                      No rooms yet. Create one to get started!
                    </div>
                  ) : (
                    rooms.map((room) => (
                      <button
                        key={room.id}
                        className="flex items-center gap-2 w-full p-2 rounded-md hover:bg-accent text-left text-sm"
                        onClick={() => navigateToRoom(room.id)}
                      >
                        <FileText className="h-4 w-4 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="truncate">{room.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {room.roomKey} • {room.documentCount} docs
                          </div>
                        </div>
                        {room.isPasswordProtected && (
                          <Lock className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Authentication Section */}
            {!isAuthenticated && (
              <div className="p-2 border-t">
                <div className="px-2 py-1">
                  <span className="text-xs font-medium text-muted-foreground">Account</span>
                </div>
                <div className="mt-1 space-y-1">
                  <button
                    className="flex items-center gap-2 w-full p-2 rounded-md hover:bg-accent text-left"
                    onClick={openLoginDialog}
                  >
                    <LogIn className="h-4 w-4" />
                    <span>Log In</span>
                  </button>
                  <button
                    className="flex items-center gap-2 w-full p-2 rounded-md hover:bg-accent text-left"
                    onClick={openSignupDialog}
                  >
                    <UserPlus className="h-4 w-4" />
                    <span>Sign Up</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User info and logout */}
          {isAuthenticated && user && (
            <div className="p-2 border-t">
              <div className="px-2 py-2 mb-2">
                <div className="text-sm font-medium">{user.username}</div>
                <div className="text-xs text-muted-foreground">{user.email}</div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 w-full p-2 rounded-md hover:bg-accent text-left"
              >
                <User className="h-4 w-4" />
                <span>Log Out</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Toggle button - show when sidebar is closed */}
      {!isOpen && (
        <Button
          variant="ghost"
          size="icon"
          className="fixed top-4 left-4 z-40"
          onClick={toggleSidebar}
        >
          <Menu className="h-5 w-5" />
        </Button>
      )}

      {/* Login Dialog */}
      <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log In</DialogTitle>
            <DialogDescription>Log in to access your saved rooms and collaborate</DialogDescription>
          </DialogHeader>
          
          {(loginFormError || error) && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {loginFormError || error}
              </AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={handleLogin} className="space-y-4 pt-4">
            <div className="space-y-2">
              <label htmlFor="login-email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="login-email"
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="login-password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="login-password"
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Log In
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Signup Dialog */}
      <Dialog open={showSignupDialog} onOpenChange={setShowSignupDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign Up</DialogTitle>
            <DialogDescription>Create an account to save your rooms and collaborate</DialogDescription>
          </DialogHeader>
          
          {(signupFormError || error) && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {signupFormError || error}
              </AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={handleSignup} className="space-y-4 pt-4">
            <div className="space-y-2">
              <label htmlFor="signup-username" className="text-sm font-medium">
                Username
              </label>
              <Input
                id="signup-username"
                type="text"
                value={signupUsername}
                onChange={(e) => setSignupUsername(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="signup-email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="signup-email"
                type="email"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="signup-password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="signup-password"
                type="password"
                value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)}
                required
                disabled={isLoading}
                minLength={6}
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign Up
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
