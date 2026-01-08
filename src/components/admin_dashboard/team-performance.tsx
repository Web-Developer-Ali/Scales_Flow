"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

const teamMembers = [
  { name: "Sarah Chen", deals: 12, target: 10, initials: "SC" },
  { name: "Marcus Johnson", deals: 10, target: 10, initials: "MJ" },
  { name: "Elena Rodriguez", deals: 9, target: 10, initials: "ER" },
  { name: "David Kim", deals: 7, target: 10, initials: "DK" },
  { name: "Lisa Thompson", deals: 6, target: 10, initials: "LT" },
]

export function TeamPerformance() {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle>Team Performance</CardTitle>
        <CardDescription>Deals closed this quarter</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {teamMembers.map((member) => {
            const percentage = (member.deals / member.target) * 100
            return (
              <div key={member.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-primary/20 text-primary">{member.initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium text-foreground">{member.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {member.deals} / {member.target} deals
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-primary">{percentage.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-primary h-full transition-all duration-300"
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
