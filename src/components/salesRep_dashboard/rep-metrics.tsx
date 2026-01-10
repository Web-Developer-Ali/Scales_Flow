"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, DollarSign, Target, Zap } from "lucide-react"

const metrics = [
  {
    title: "My Pipeline Value",
    value: "$685K",
    change: "+18%",
    icon: DollarSign,
    color: "bg-blue-500/10 text-blue-500",
  },
  {
    title: "Closed This Month",
    value: "$145K",
    change: "+5%",
    icon: TrendingUp,
    color: "bg-emerald-500/10 text-emerald-500",
  },
  {
    title: "My Target",
    value: "34 / 40",
    change: "85%",
    icon: Target,
    color: "bg-amber-500/10 text-amber-500",
  },
  {
    title: "Hot Leads",
    value: "8",
    change: "+3 this week",
    icon: Zap,
    color: "bg-red-500/10 text-red-500",
  },
]

export function RepMetrics() {
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
