"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

const deals = [
  {
    id: 1,
    company: "TechVenture Inc",
    contact: "John Smith",
    value: "$85,000",
    stage: "Proposal",
    probability: 75,
    daysInStage: 12,
  },
  {
    id: 2,
    company: "Global Solutions Ltd",
    contact: "Amy Wilson",
    value: "$120,000",
    stage: "Negotiation",
    probability: 85,
    daysInStage: 8,
  },
  {
    id: 3,
    company: "NextGen Corp",
    contact: "Robert Lee",
    value: "$65,000",
    stage: "Demo",
    probability: 60,
    daysInStage: 5,
  },
  {
    id: 4,
    company: "Enterprise Plus",
    contact: "Jennifer Davis",
    value: "$150,000",
    stage: "Qualified",
    probability: 40,
    daysInStage: 18,
  },
  {
    id: 5,
    company: "Digital Innovations",
    contact: "Michael Brown",
    value: "$95,000",
    stage: "Proposal",
    probability: 70,
    daysInStage: 14,
  },
]

const getStageColor = (stage: string) => {
  const colors: Record<string, string> = {
    Prospect: "bg-slate-500/20 text-slate-300",
    Qualified: "bg-blue-500/20 text-blue-300",
    Demo: "bg-cyan-500/20 text-cyan-300",
    Proposal: "bg-amber-500/20 text-amber-300",
    Negotiation: "bg-orange-500/20 text-orange-300",
    Closed: "bg-emerald-500/20 text-emerald-300",
  }
  return colors[stage] || "bg-gray-500/20 text-gray-300"
}

export function RecentDeals() {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle>Recent Deals</CardTitle>
        <CardDescription>Active deals in the pipeline</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Company</th>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Contact</th>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Deal Value</th>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Stage</th>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Probability</th>
                <th className="text-right py-3 px-4 font-semibold text-muted-foreground">Days</th>
              </tr>
            </thead>
            <tbody>
              {deals.map((deal) => (
                <tr
                  key={deal.id}
                  className="border-b border-border hover:bg-secondary/30 transition-colors cursor-pointer"
                >
                  <td className="py-4 px-4 font-medium text-foreground">{deal.company}</td>
                  <td className="py-4 px-4 text-muted-foreground">{deal.contact}</td>
                  <td className="py-4 px-4 font-semibold text-primary">{deal.value}</td>
                  <td className="py-4 px-4">
                    <Badge className={getStageColor(deal.stage)}>{deal.stage}</Badge>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-secondary rounded-full h-1.5">
                        <div className="bg-accent h-full rounded-full" style={{ width: `${deal.probability}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground">{deal.probability}%</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-right text-muted-foreground">{deal.daysInStage}d</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex justify-center">
          <Button variant="ghost" className="gap-2">
            View All Deals <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
