"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const recentDeals = [
  {
    id: 1,
    company: "TechCorp Solutions",
    value: "$95K",
    stage: "Negotiation",
    probability: "85%",
    daysInStage: 5,
    nextAction: "Waiting for signature",
    color: "bg-green-500/10 text-green-500",
  },
  {
    id: 2,
    company: "CloudSys Inc",
    value: "$120K",
    stage: "Proposal",
    probability: "75%",
    daysInStage: 8,
    nextAction: "Present changes",
    color: "bg-blue-500/10 text-blue-500",
  },
  {
    id: 3,
    company: "DataFlow Analytics",
    value: "$85K",
    stage: "Demo",
    probability: "60%",
    daysInStage: 12,
    nextAction: "Schedule demo",
    color: "bg-cyan-500/10 text-cyan-500",
  },
  {
    id: 4,
    company: "NextGen Software",
    value: "$150K",
    stage: "Qualified",
    probability: "40%",
    daysInStage: 3,
    nextAction: "Initial meeting",
    color: "bg-amber-500/10 text-amber-500",
  },
]

const getStageColor = (stage: string) => {
  switch (stage) {
    case "Negotiation":
      return "bg-green-500/10 text-green-500 border-green-500/30"
    case "Proposal":
      return "bg-blue-500/10 text-blue-500 border-blue-500/30"
    case "Demo":
      return "bg-cyan-500/10 text-cyan-500 border-cyan-500/30"
    default:
      return "bg-amber-500/10 text-amber-500 border-amber-500/30"
  }
}

export function RecentDeals() {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle>Active Deals</CardTitle>
        <CardDescription>Your current opportunities ranked by close probability</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentDeals.map((deal) => (
            <div
              key={deal.id}
              className="p-4 rounded-lg bg-secondary/50 border border-border hover:border-border/80 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-foreground text-sm">{deal.company}</h4>
                  <p className="text-xs text-muted-foreground mt-1">In stage for {deal.daysInStage} days</p>
                </div>
                <p className="text-lg font-bold text-foreground">{deal.value}</p>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <Badge variant="outline" className={getStageColor(deal.stage)}>
                  {deal.stage}
                </Badge>
                <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/30">
                  {deal.probability}
                </Badge>
              </div>

              <p className="text-xs text-muted-foreground italic">Next: {deal.nextAction}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
