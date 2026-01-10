"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts"

const pipelineData = [
  { stage: "Prospect", deals: 8, value: 120 },
  { stage: "Qualified", deals: 6, value: 210 },
  { stage: "Demo", deals: 5, value: 245 },
  { stage: "Proposal", deals: 3, value: 180 },
  { stage: "Negotiation", deals: 2, value: 145 },
]

const progressData = [
  { week: "Week 1", target: 8, actual: 7 },
  { week: "Week 2", target: 8, actual: 9 },
  { week: "Week 3", target: 8, actual: 6 },
  { week: "Week 4", target: 8, actual: 8 },
  { week: "Current", target: 8, actual: 4 },
]

export function RepPipeline() {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle>Your Pipeline by Stage</CardTitle>
        <CardDescription>Active deals at each stage of the sales cycle</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={pipelineData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="stage" stroke="var(--muted-foreground)" fontSize={12} />
            <YAxis stroke="var(--muted-foreground)" />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--card)",
                border: `1px solid var(--border)`,
                borderRadius: "8px",
              }}
            />
            <Bar dataKey="deals" name="Deal Count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>

        {/* Weekly Performance */}
        <div className="mt-8">
          <h3 className="text-sm font-semibold text-foreground mb-4">Weekly Target Progress</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={progressData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="week" stroke="var(--muted-foreground)" fontSize={12} />
              <YAxis stroke="var(--muted-foreground)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  border: `1px solid var(--border)`,
                  borderRadius: "8px",
                }}
              />
              <Line type="monotone" dataKey="target" stroke="#f59e0b" name="Target" strokeWidth={2} />
              <Line type="monotone" dataKey="actual" stroke="#3b82f6" name="Actual" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
