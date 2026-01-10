"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { CheckCircle, Clock, AlertCircle } from "lucide-react"

const activities = [
  {
    user: "Sarah Chen",
    action: "Closed deal",
    company: "TechCorp Inc",
    value: "$85,000",
    time: "2 hours ago",
    type: "success",
    initials: "SC",
  },
  {
    user: "Marcus Johnson",
    action: "Advanced to Proposal",
    company: "FinanceHub",
    value: "$120,000",
    time: "4 hours ago",
    type: "progress",
    initials: "MJ",
  },
  {
    user: "Elena Rodriguez",
    action: "Scheduled demo",
    company: "RetailGlobal",
    value: "$45,000",
    time: "6 hours ago",
    type: "progress",
    initials: "ER",
  },
  {
    user: "David Kim",
    action: "Deal needs attention",
    company: "CloudServices",
    value: "$160,000",
    time: "8 hours ago",
    type: "warning",
    initials: "DK",
  },
]

const typeConfig = {
  success: { icon: CheckCircle, color: "text-emerald-500" },
  progress: { icon: Clock, color: "text-blue-500" },
  warning: { icon: AlertCircle, color: "text-amber-500" },
}

export function TeamActivities() {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle>Team Activities</CardTitle>
        <CardDescription>Recent team member actions and milestones</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => {
            const config = typeConfig[activity.type as keyof typeof typeConfig]
            const Icon = config.icon
            return (
              <div
                key={`${activity.user}-${activity.company}`}
                className="flex items-start gap-4 pb-4 border-b border-border last:border-b-0"
              >
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-primary/20 text-primary text-sm font-semibold">
                    {activity.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold text-foreground">{activity.user}</p>
                    <Icon className={`w-4 h-4 ${config.color}`} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {activity.action} • <span className="font-semibold">{activity.company}</span>
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-muted-foreground">{activity.value}</span>
                    <span className="text-xs text-muted-foreground">{activity.time}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
