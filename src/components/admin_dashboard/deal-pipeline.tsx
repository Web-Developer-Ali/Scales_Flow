"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts"

const pipelineData = [
  { stage: "Prospect", count: 24, value: 180 },
  { stage: "Qualified", count: 19, value: 420 },
  { stage: "Demo", count: 12, value: 680 },
  { stage: "Proposal", count: 8, value: 540 },
  { stage: "Negotiation", count: 5, value: 360 },
  { stage: "Closed", count: 3, value: 220 },
]

const colors = ["#9333ea", "#3b82f6", "#06b6d4", "#f59e0b", "#ef4444", "#10b981"]

export function DealPipeline() {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle>Deal Pipeline</CardTitle>
        <CardDescription>Deals by stage from first contact to closed sale</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={pipelineData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="stage" stroke="var(--muted-foreground)" />
            <YAxis stroke="var(--muted-foreground)" />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--card)",
                border: `1px solid var(--border)`,
                borderRadius: "8px",
                color: "var(--foreground)",
              }}
            />
            <Legend />
            <Bar dataKey="count" name="Deal Count" radius={[8, 8, 0, 0]}>
              {pipelineData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Pipeline Summary */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          {["Prospect", "Active", "Closing"].map((label, idx) => (
            <div key={label} className="p-4 rounded-lg bg-secondary/50 border border-border">
              <p className="text-xs text-muted-foreground font-medium">{label}</p>
              <p className="text-lg font-bold text-foreground mt-1">{idx === 0 ? 24 : idx === 1 ? 25 : 8}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
