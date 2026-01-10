"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Phone, Mail, Calendar, AlertCircle } from "lucide-react"

const tasks = [
  {
    id: 1,
    title: "Call TechCorp",
    type: "call",
    priority: "high",
    dueDate: "Today",
    icon: Phone,
  },
  {
    id: 2,
    title: "Send proposal to Acme Inc",
    type: "email",
    priority: "high",
    dueDate: "Today",
    icon: Mail,
  },
  {
    id: 3,
    title: "Follow up demo with CloudSys",
    type: "follow-up",
    priority: "medium",
    dueDate: "Tomorrow",
    icon: Calendar,
  },
  {
    id: 4,
    title: "Review contract - NextGen",
    type: "review",
    priority: "medium",
    dueDate: "Tomorrow",
    icon: AlertCircle,
  },
  {
    id: 5,
    title: "Schedule meeting with DataFlow",
    type: "meeting",
    priority: "low",
    dueDate: "Friday",
    icon: Calendar,
  },
]

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "high":
      return "bg-red-500/10 text-red-500 border-red-500/30"
    case "medium":
      return "bg-amber-500/10 text-amber-500 border-amber-500/30"
    default:
      return "bg-blue-500/10 text-blue-500 border-blue-500/30"
  }
}

export function TasksAndActivities() {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle>Tasks & Follow-ups</CardTitle>
        <CardDescription>Your action items for this week</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {tasks.map((task) => {
            const Icon = task.icon
            return (
              <div
                key={task.id}
                className="p-3 rounded-lg bg-secondary/50 border border-border hover:bg-secondary transition-colors"
              >
                <div className="flex items-start gap-3">
                  <Icon className="w-4 h-4 text-muted-foreground mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{task.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{task.dueDate}</p>
                  </div>
                  <Badge variant="outline" className={getPriorityColor(task.priority)}>
                    {task.priority}
                  </Badge>
                </div>
              </div>
            )
          })}
        </div>

        {/* Completed Summary */}
        <div className="mt-6 p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/30">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <div>
              <p className="text-sm font-medium text-emerald-500">Great progress!</p>
              <p className="text-xs text-emerald-500/80 mt-0.5">12 tasks completed this week</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
