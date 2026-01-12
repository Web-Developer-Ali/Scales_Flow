"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Download, Eye } from "lucide-react"

const allDeals = [
  {
    id: 1,
    company: "TechVenture Inc",
    contact: "John Smith",
    salesperson: "Sarah Johnson",
    value: "$85,000",
    amount: 85000,
    stage: "Proposal",
    probability: 75,
    daysInStage: 12,
    closingDate: "2024-02-15",
  },
  {
    id: 2,
    company: "Global Solutions Ltd",
    contact: "Amy Wilson",
    salesperson: "Mike Chen",
    value: "$120,000",
    amount: 120000,
    stage: "Negotiation",
    probability: 85,
    daysInStage: 8,
    closingDate: "2024-02-10",
  },
  {
    id: 3,
    company: "NextGen Corp",
    contact: "Robert Lee",
    salesperson: "Sarah Johnson",
    value: "$65,000",
    amount: 65000,
    stage: "Demo",
    probability: 60,
    daysInStage: 5,
    closingDate: "2024-02-28",
  },
  {
    id: 4,
    company: "Enterprise Plus",
    contact: "Jennifer Davis",
    salesperson: "David Martinez",
    value: "$150,000",
    amount: 150000,
    stage: "Qualified",
    probability: 40,
    daysInStage: 18,
    closingDate: "2024-03-15",
  },
  {
    id: 5,
    company: "Digital Innovations",
    contact: "Michael Brown",
    salesperson: "Sarah Johnson",
    value: "$95,000",
    amount: 95000,
    stage: "Proposal",
    probability: 70,
    daysInStage: 14,
    closingDate: "2024-02-20",
  },
  {
    id: 6,
    company: "CloudFirst Systems",
    contact: "Lisa Anderson",
    salesperson: "Mike Chen",
    value: "$200,000",
    amount: 200000,
    stage: "Closed",
    probability: 100,
    daysInStage: 45,
    closingDate: "2024-01-30",
  },
  {
    id: 7,
    company: "InnovateTech",
    contact: "David Wilson",
    salesperson: "David Martinez",
    value: "$75,000",
    amount: 75000,
    stage: "Prospect",
    probability: 20,
    daysInStage: 3,
    closingDate: "2024-04-15",
  },
  {
    id: 8,
    company: "FutureScale Inc",
    contact: "Emma Thompson",
    salesperson: "Sarah Johnson",
    value: "$110,000",
    amount: 110000,
    stage: "Demo",
    probability: 55,
    daysInStage: 9,
    closingDate: "2024-03-05",
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

export function ViewAllDealsClient() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStage, setSelectedStage] = useState("all")
  const [sortBy, setSortBy] = useState("date")

  const filteredDeals = allDeals.filter((deal) => {
    const matchesSearch =
      deal.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deal.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deal.salesperson.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStage = selectedStage === "all" || deal.stage === selectedStage

    return matchesSearch && matchesStage
  })

  const sortedDeals = [...filteredDeals].sort((a, b) => {
    if (sortBy === "value") return b.amount - a.amount
    if (sortBy === "probability") return b.probability - a.probability
    return new Date(b.closingDate).getTime() - new Date(a.closingDate).getTime()
  })

  const totalValue = sortedDeals.reduce((sum, deal) => sum + deal.amount, 0)
  const closedValue = sortedDeals.filter((deal) => deal.stage === "Closed").reduce((sum, deal) => sum + deal.amount, 0)

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">All Deals</h1>
          <p className="text-muted-foreground">Manage and track all deals across your organization</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-2">Total Deals</p>
              <p className="text-2xl font-bold text-foreground">{sortedDeals.length}</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-2">Pipeline Value</p>
              <p className="text-2xl font-bold text-foreground">${(totalValue / 1000).toFixed(0)}K</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-2">Closed Value</p>
              <p className="text-2xl font-bold text-emerald-400">${(closedValue / 1000).toFixed(0)}K</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-2">Avg Probability</p>
              <p className="text-2xl font-bold text-foreground">
                {sortedDeals.length > 0
                  ? Math.round(sortedDeals.reduce((sum, deal) => sum + deal.probability, 0) / sortedDeals.length)
                  : 0}
                %
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="bg-card border-border mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by company, contact, or salesperson..."
                  className="pl-10 bg-secondary border-border"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Stage Filter */}
              <Select value={selectedStage} onValueChange={setSelectedStage}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Filter by stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stages</SelectItem>
                  <SelectItem value="Prospect">Prospect</SelectItem>
                  <SelectItem value="Qualified">Qualified</SelectItem>
                  <SelectItem value="Demo">Demo</SelectItem>
                  <SelectItem value="Proposal">Proposal</SelectItem>
                  <SelectItem value="Negotiation">Negotiation</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Closing Date</SelectItem>
                  <SelectItem value="value">Deal Value</SelectItem>
                  <SelectItem value="probability">Probability</SelectItem>
                </SelectContent>
              </Select>

              {/* Export Button */}
              <Button className="bg-black hover:bg-black/80 text-white gap-2">
                <Download className="w-4 h-4" />
                Export
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Deals Table */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Deal List</CardTitle>
            <CardDescription>Showing {sortedDeals.length} deals</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Company</th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Contact</th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Salesperson</th>
                    <th className="text-right py-3 px-4 font-semibold text-muted-foreground">Value</th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Stage</th>
                    <th className="text-center py-3 px-4 font-semibold text-muted-foreground">Probability</th>
                    <th className="text-center py-3 px-4 font-semibold text-muted-foreground">Closing Date</th>
                    <th className="text-center py-3 px-4 font-semibold text-muted-foreground">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedDeals.map((deal) => (
                    <tr key={deal.id} className="border-b border-border hover:bg-secondary/30 transition-colors">
                      <td className="py-4 px-4 font-medium text-foreground">{deal.company}</td>
                      <td className="py-4 px-4 text-muted-foreground">{deal.contact}</td>
                      <td className="py-4 px-4 text-muted-foreground">{deal.salesperson}</td>
                      <td className="py-4 px-4 font-semibold text-primary text-right">{deal.value}</td>
                      <td className="py-4 px-4">
                        <Badge className={getStageColor(deal.stage)}>{deal.stage}</Badge>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-12 bg-secondary rounded-full h-1.5">
                            <div className="bg-accent h-full rounded-full" style={{ width: `${deal.probability}%` }} />
                          </div>
                          <span className="text-xs text-muted-foreground w-8">{deal.probability}%</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-muted-foreground text-center text-xs">{deal.closingDate}</td>
                      <td className="py-4 px-4 text-center">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {sortedDeals.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No deals found matching your filters</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
