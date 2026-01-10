"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, Users, Target, Zap } from "lucide-react"

const metrics = [
  {
    title: "Team Pipeline",
    value: "$1.8M",
    change: "+15%",
    icon: TrendingUp,
    color: "bg-blue-500/10 text-blue-500",
  },
  {
    title: "Direct Reports",
    value: "5",
    change: "2 exceeding targets",
    icon: Users,
    color: "bg-emerald-500/10 text-emerald-500",
  },
  {
    title: "Team Target",
    value: "38 / 45",
    change: "84% completion",
    icon: Target,
    color: "bg-amber-500/10 text-amber-500",
  },
  {
    title: "Personal Pipeline",
    value: "$420K",
    change: "+6 deals",
    icon: Zap,
    color: "bg-purple-500/10 text-purple-500",
  },
]

export function ManagerMetrics() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric) => {
        const Icon = metric.icon
        return (
          <Card key={metric.title} className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{metric.title}</CardTitle>
              <div className={`p-2 rounded-lg ${metric.color}`}>
                <Icon className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{metric.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{metric.change}</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
