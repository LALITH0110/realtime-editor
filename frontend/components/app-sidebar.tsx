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
import { Home, LogIn, Plus, User, UserPlus, Menu, X, FileText, RefreshCw } from "lucide-react"

type Room = {
  id: string
  name: string
  isLocked: boolean
}

interface AppSidebarProps {
  defaultOpen?: boolean
}

export function AppSidebar({ defaultOpen = false }: AppSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [rooms, setRooms] = useState<Room[]>([
    { id: "room-abc123", name: "Project Alpha", isLocked: false },
    { id: "room-def456", name: "Team Brainstorm", isLocked: true },
    { id: "room-ghi789", name: "Code Review", isLocked: false },
  ])
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [signupEmail, setSignupEmail] = useState("")
  const [signupPassword, setSignupPassword] = useState("")
  const [signupUsername, setSignupUsername] = useState("")
  const [showLoginDialog, setShowLoginDialog] = useState(false)
  const [showSignupDialog, setShowSignupDialog] = useState(false)

  // Always start with the sidebar closed
  useEffect(() => {
    setIsOpen(false)
  }, [])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, this would authenticate with your backend
    setIsAuthenticated(true)
    setLoginEmail("")
    setLoginPassword("")
    setShowLoginDialog(false)
  }

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, this would register with your backend
    setIsAuthenticated(true)
    setSignupEmail("")
    setSignupPassword("")
    setSignupUsername("")
    setShowSignupDialog(false)
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
  }

  const navigateToRoom = (roomId: string) => {
    router.push(`/room/${roomId}/select`)
  }

  const toggleSidebar = () => {
    setIsOpen(!isOpen)
  }

  return (
    <>
      {/* Hamburger menu button - always visible */}
      <Button variant="ghost" size="icon" onClick={toggleSidebar} className="fixed top-4 left-4 z-50">
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-background border-r border-border transform transition-transform duration-200 ease-in-out h-full ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:w-64 md:flex-shrink-0`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h1 className="text-xl font-bold">CollabEdge</h1>
            <Button variant="ghost" size="icon" onClick={toggleSidebar} className="md:hidden">
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Sidebar content */}
          <div className="flex-1 overflow-auto">
            <div className="p-2">
              <button
                onClick={() => router.push("/")}
                className={`flex items-center gap-2 w-full p-2 rounded-md hover:bg-accent text-left ${
                  pathname === "/" ? "bg-accent" : ""
                }`}
              >
                <Home className="h-4 w-4" />
                <span>Home</span>
              </button>
            </div>

            {isAuthenticated ? (
              <>
                <div className="p-2">
                  <div className="flex items-center justify-between px-2 py-1">
                    <span className="text-xs font-medium text-muted-foreground">My Workspaces</span>
                    <Button variant="ghost" size="icon" className="h-5 w-5">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="mt-1 space-y-1">
                    <button className="flex items-center gap-2 w-full p-2 rounded-md hover:bg-accent text-left">
                      <FileText className="h-4 w-4" />
                      <span>Data Dashboards</span>
                    </button>
                    <button className="flex items-center gap-2 w-full p-2 rounded-md hover:bg-accent text-left">
                      <FileText className="h-4 w-4" />
                      <span>Q2 Analytics</span>
                    </button>
                    <button className="flex items-center gap-2 w-full p-2 rounded-md hover:bg-accent text-left">
                      <FileText className="h-4 w-4" />
                      <span>Client Presentation</span>
                    </button>
                  </div>
                </div>

                <div className="p-2">
                  <div className="flex items-center justify-between px-2 py-1">
                    <span className="text-xs font-medium text-muted-foreground">Recent Rooms</span>
                    <Button variant="ghost" size="icon" className="h-5 w-5">
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="mt-1 space-y-1">
                    {rooms.map((room) => (
                      <button
                        key={room.id}
                        onClick={() => navigateToRoom(room.id)}
                        className="flex items-center gap-2 w-full p-2 rounded-md hover:bg-accent text-left"
                      >
                        {room.isLocked ? <span className="text-amber-500">🔒</span> : <span>📄</span>}
                        <span>{room.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="p-2">
                <div className="px-2 py-1">
                  <span className="text-xs font-medium text-muted-foreground">Account</span>
                </div>
                <div className="mt-1 space-y-1">
                  <button
                    className="flex items-center gap-2 w-full p-2 rounded-md hover:bg-accent text-left"
                    onClick={() => setShowLoginDialog(true)}
                  >
                    <LogIn className="h-4 w-4" />
                    <span>Log In</span>
                  </button>
                  <button
                    className="flex items-center gap-2 w-full p-2 rounded-md hover:bg-accent text-left"
                    onClick={() => setShowSignupDialog(true)}
                  >
                    <UserPlus className="h-4 w-4" />
                    <span>Sign Up</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar footer */}
          {isAuthenticated && (
            <div className="p-2 border-t">
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

      {/* Login Dialog */}
      <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log In</DialogTitle>
            <DialogDescription>Log in to access your saved rooms</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleLogin} className="space-y-4 pt-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
              />
            </div>
            <DialogFooter>
              <Button type="submit">Log In</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Signup Dialog */}
      <Dialog open={showSignupDialog} onOpenChange={setShowSignupDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Account</DialogTitle>
            <DialogDescription>Sign up to save and manage your rooms</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSignup} className="space-y-4 pt-4">
            <div className="space-y-2">
              <label htmlFor="signup-username" className="text-sm font-medium">
                Username
              </label>
              <Input
                id="signup-username"
                value={signupUsername}
                onChange={(e) => setSignupUsername(e.target.value)}
                required
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
              />
            </div>
            <DialogFooter>
              <Button type="submit">Sign Up</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
