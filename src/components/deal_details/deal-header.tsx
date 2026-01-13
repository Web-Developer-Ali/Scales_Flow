"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Share2, MoreVertical } from "lucide-react"

interface DealHeaderProps {
  company: string
  value: string
  stage: string
  probability: string
  description: string
  expectedCloseDate: string
  onBack: () => void
}

export function DealHeader({
  company,
  value,
  stage,
  probability,
  description,
  expectedCloseDate,
  onBack,
}: DealHeaderProps) {
  return (
    <div className="border-b border-border bg-card/50">
      <div className="max-w-4xl mx-auto px-6 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Button onClick={onBack} variant="outline" size="sm" className="hover:bg-secondary bg-transparent">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>

        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{company}</h1>
            <p className="text-muted-foreground mt-2">{description}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Share2 className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Deal Value</p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Stage</p>
            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30 mt-1">
              {stage}
            </Badge>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Probability</p>
            <p className="text-2xl font-bold text-foreground">{probability}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Expected Close</p>
            <p className="text-sm font-semibold text-foreground">{expectedCloseDate}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
