"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const personalDeals = [
  { company: "TechCorp", value: "$85K", stage: "Negotiation", probability: "75%" },
  { company: "FinanceInc", value: "$120K", stage: "Proposal", probability: "60%" },
  { company: "RetailCo", value: "$45K", stage: "Demo", probability: "40%" },
  { company: "CloudSys", value: "$160K", stage: "Discovery", probability: "25%" },
]

const stageColors = {
  Negotiation: "bg-emerald-500/10 text-emerald-500",
  Proposal: "bg-blue-500/10 text-blue-500",
  Demo: "bg-amber-500/10 text-amber-500",
  Discovery: "bg-purple-500/10 text-purple-500",
}

export function PersonalPipeline() {
  const total = personalDeals.reduce((sum, deal) => sum + Number.parseInt(deal.value.replace(/\D/g, "")), 0)

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle>Personal Pipeline</CardTitle>
        <CardDescription>Your active opportunities</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="bg-primary/10 rounded-lg p-3 border border-primary/20">
            <p className="text-xs text-muted-foreground">Total Pipeline Value</p>
            <p className="text-xl font-bold text-primary mt-1">${(total / 1000).toFixed(0)}K</p>
          </div>

          <div className="space-y-3">
            {personalDeals.map((deal) => (
              <div key={deal.company} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">{deal.company}</p>
                  <p className="text-xs text-muted-foreground mt-1">{deal.value}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant="outline" className={stageColors[deal.stage as keyof typeof stageColors]}>
                    {deal.stage}
                  </Badge>
                  <span className="text-xs font-semibold text-primary">{deal.probability}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
