"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, DollarSign, Target, Clock } from "lucide-react"

const metrics = [
  {
    title: "Total Pipeline",
    value: "$2.4M",
    change: "+12%",
    icon: DollarSign,
    color: "bg-blue-500/10 text-blue-500",
  },
  {
    title: "Closed This Month",
    value: "$450K",
    change: "+8%",
    icon: TrendingUp,
    color: "bg-emerald-500/10 text-emerald-500",
  },
  {
    title: "Deal Target",
    value: "42 / 50",
    change: "84%",
    icon: Target,
    color: "bg-amber-500/10 text-amber-500",
  },
  {
    title: "Avg. Close Time",
    value: "32 days",
    change: "-3 days",
    icon: Clock,
    color: "bg-purple-500/10 text-purple-500",
  },
]

export function SalesMetrics() {
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
              <p className="text-xs text-muted-foreground mt-1">{metric.change} from last month</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
