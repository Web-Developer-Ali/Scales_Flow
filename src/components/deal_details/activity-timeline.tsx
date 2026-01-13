"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { ReactNode } from "react"

interface Activity {
  type: string
  date: string
  time: string
  notes: string
  icon: ReactNode
}

interface ActivityTimelineProps {
  activities: Activity[]
}

export function ActivityTimeline({ activities }: ActivityTimelineProps) {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle>Activity Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity, idx) => (
            <div key={idx} className="flex gap-4 pb-4 border-b border-border last:border-0 last:pb-0">
              <div className="flex-shrink-0 w-20">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="text-foreground">{activity.icon}</span>
                  <div>
                    <div>{activity.date}</div>
                    <div>{activity.time}</div>
                  </div>
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-foreground">{activity.type}</p>
                  {activity.type === "Stage Change" && (
                    <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/30 text-xs">
                      Stage Updated
                    </Badge>
                  )}
                  {activity.type !== "Stage Change" && (
                    <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30 text-xs">
                      {activity.type}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">{activity.notes}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
