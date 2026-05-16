"use client"
import { Bell, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"

export function RepDashboardHeader() {
  return (
    <header className="bg-card border-b border-border sticky top-0 z-40">
      <div className="px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Pipeline</h1>
          <p className="text-sm text-muted-foreground mt-1">Track your deals and stay on top of your targets</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <Bell className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  )
}
