"use client"
import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { AnimatedBackground } from "@/components/animated-background"
import { AppSidebar } from "@/components/app-sidebar"
import { useAuth } from "@/contexts/AuthContext"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { AlertCircle, Loader2 } from "lucide-react"

export function LandingPage() {
  const router = useRouter()
  const { isAuthenticated, user, login, signup, isLoading, error, clearError } = useAuth()
  const [showSidebar, setShowSidebar] = useState(false)
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [showLoginDialog, setShowLoginDialog] = useState(false)
  const [loginFormError, setLoginFormError] = useState<string | null>(null)
  
  // Signup form state
  const [signupEmail, setSignupEmail] = useState("")
  const [signupPassword, setSignupPassword] = useState("")
  const [signupUsername, setSignupUsername] = useState("")
  const [showSignupDialog, setShowSignupDialog] = useState(false)
  const [signupFormError, setSignupFormError] = useState<string | null>(null)

  const handleJoinRoom = () => {
    router.push("/join")
  }

  const handleCreateRoom = () => {
    router.push("/create")
  }

  const handleLoginClick = () => {
    setShowLoginDialog(true)
    setLoginFormError(null)
    clearError()
  }

  const handleSignupClick = () => {
    setShowSignupDialog(true)
    setSignupFormError(null)
    clearError()
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

  return (
    <div className="min-h-screen flex flex-col">
      <AppSidebar defaultOpen={showSidebar} />
      <AnimatedBackground />

      {/* Header */}
      <header className="relative z-10 border-b border-white/10 backdrop-blur-sm bg-black/20">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold">CollabEdge</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm">
              About
            </Button>
            <Button variant="ghost" size="sm">
              Features
            </Button>
            <Button variant="ghost" size="sm">
              Pricing
            </Button>
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Welcome, {user?.username}</span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowSidebar(true)}
                >
                  Dashboard
                </Button>
              </div>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={handleLoginClick}>
                  Log In
                </Button>
                <Button size="sm" onClick={handleSignupClick}>Sign Up</Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex">
        {/* Hero Content */}
        <div className="relative z-10 container mx-auto flex flex-col md:flex-row items-center justify-between px-4 py-16">
          <div className="max-w-2xl mb-12 md:mb-0">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">Real-time collaborative workspace</h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8">
              Create and join rooms to collaborate on code, documents, spreadsheets, presentations, and more in
              real-time with your team.
            </p>

            <div className="flex flex-wrap gap-4 mb-8">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                <span>Code Editing</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-green-500"></div>
                <span>Rich Text</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                <span>Spreadsheets</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-purple-500"></div>
                <span>Presentations</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <Button size="lg" onClick={handleCreateRoom}>
                Create New Room
              </Button>
              <Button variant="outline" size="lg" onClick={handleJoinRoom}>
                Join Existing Room
              </Button>
            </div>
          </div>

          <div className="w-full max-w-md">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg blur opacity-25"></div>
              <div className="relative bg-background/20 backdrop-blur-sm border border-white/10 rounded-lg p-6">
                <div className="aspect-video bg-black/40 rounded-md mb-4 flex items-center justify-center">
                  <div className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600">
                    CollabEdge
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="h-4 bg-white/10 rounded-full w-3/4"></div>
                  <div className="h-4 bg-white/10 rounded-full"></div>
                  <div className="h-4 bg-white/10 rounded-full w-5/6"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 backdrop-blur-sm bg-black/20">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-muted-foreground">© 2025 CollabEdge. All rights reserved.</p>
            <div className="flex gap-4 mt-4 md:mt-0">
              <Button variant="ghost" size="sm">
                Terms
              </Button>
              <Button variant="ghost" size="sm">
                Privacy
              </Button>
              <Button variant="ghost" size="sm">
                Contact
              </Button>
            </div>
          </div>
        </div>
      </footer>

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
    </div>
  )
}
