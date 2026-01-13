"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronRight } from "lucide-react"

interface StageSelectorProps {
  stages: string[]
  currentStage: string
  onStageSelect: (stage: string) => void
  onAddProgressClick: () => void
}

export function StageSelector({ stages, currentStage, onStageSelect, onAddProgressClick }: StageSelectorProps) {
  const currentStageIndex = stages.indexOf(currentStage)

  return (
    <Card className="bg-card border-border sticky top-6">
      <CardHeader>
        <CardTitle>Move to Next Stage</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          {stages.map((stage, idx) => (
            <button
              key={stage}
              onClick={() => onStageSelect(stage)}
              disabled={idx < currentStageIndex}
              className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                stage === currentStage
                  ? "bg-blue-500/10 border-2 border-blue-500 text-blue-500"
                  : idx < currentStageIndex
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-secondary border-2 border-transparent"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{stage}</span>
                {stage === currentStage && (
                  <Badge variant="outline" className="text-xs">
                    Current
                  </Badge>
                )}
                {idx > currentStageIndex && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
              </div>
            </button>
          ))}
        </div>

        <Button onClick={onAddProgressClick} className="w-full bg-black hover:bg-black/80 mt-4">
          Log Progress
        </Button>
      </CardContent>
    </Card>
  )
}
