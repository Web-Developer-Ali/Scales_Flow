"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

const teamMembers = [
  {
    name: "Sarah Chen",
    role: "Senior Sales Rep",
    deals: 12,
    target: 10,
    status: "exceeding",
    initials: "SC",
  },
  {
    name: "Marcus Johnson",
    role: "Sales Rep",
    deals: 10,
    target: 10,
    status: "on-track",
    initials: "MJ",
  },
  {
    name: "Elena Rodriguez",
    role: "Sales Rep",
    deals: 9,
    target: 10,
    status: "on-track",
    initials: "ER",
  },
  {
    name: "David Kim",
    role: "Sales Rep",
    deals: 7,
    target: 10,
    status: "at-risk",
    initials: "DK",
  },
  {
    name: "Lisa Thompson",
    role: "Junior Sales Rep",
    deals: 6,
    target: 10,
    status: "at-risk",
    initials: "LT",
  },
]

const statusConfig = {
  exceeding: { badge: "success", text: "Exceeding Target" },
  "on-track": { badge: "secondary", text: "On Track" },
  "at-risk": { badge: "destructive", text: "At Risk" },
}

export function TeamOverview() {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle>Team Overview</CardTitle>
        <CardDescription>Direct reports performance and quota progress</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {teamMembers.map((member) => {
            const percentage = (member.deals / member.target) * 100
            const config = statusConfig[member.status as keyof typeof statusConfig]
            return (
              <div key={member.name} className="space-y-3 pb-4 border-b border-border last:border-b-0 last:pb-0">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-primary/20 text-primary text-sm font-semibold">
                        {member.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{member.name}</p>
                      <p className="text-xs text-muted-foreground">{member.role}</p>
                    </div>
                  </div>
                  <Badge variant={config.badge as any}>{config.text}</Badge>
                </div>
                <div className="ml-13">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">
                      {member.deals} / {member.target} deals
                    </span>
                    <span className="text-xs font-semibold text-primary">{percentage.toFixed(0)}%</span>
                  </div>
                  <Progress value={Math.min(percentage, 100)} className="h-2" />
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
