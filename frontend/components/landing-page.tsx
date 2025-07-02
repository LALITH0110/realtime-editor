"use client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { AnimatedBackground } from "@/components/animated-background"

export function LandingPage() {
  const router = useRouter()

  const handleJoinRoom = () => {
    router.push("/join")
  }

  const handleCreateRoom = () => {
    router.push("/create")
  }

  return (
    <div className="min-h-screen flex flex-col">
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
            <Button variant="outline" size="sm">
              Log In
            </Button>
            <Button size="sm">Sign Up</Button>
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
    </div>
  )
}
