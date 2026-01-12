import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, TrendingUp, Percent, Users } from "lucide-react"

interface MetricsCardsProps {
  totalRevenue: number
  totalDeals: number
  avgConversionRate: number
  teamSize: number
}

export function MetricsCards({ totalRevenue, totalDeals, avgConversionRate, teamSize }: MetricsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card className="bg-white border-gray-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-700">Total Revenue</CardTitle>
          <DollarSign className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">${(totalRevenue / 1000).toFixed(1)}K</div>
          <p className="text-xs text-gray-600 mt-1">Across all reps</p>
        </CardContent>
      </Card>

      <Card className="bg-white border-gray-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-700">Total Deals Closed</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">{totalDeals}</div>
          <p className="text-xs text-gray-600 mt-1">This period</p>
        </CardContent>
      </Card>

      <Card className="bg-white border-gray-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-700">Avg Conversion Rate</CardTitle>
          <Percent className="h-4 w-4 text-amber-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">{avgConversionRate}%</div>
          <p className="text-xs text-gray-600 mt-1">Average across team</p>
        </CardContent>
      </Card>

      <Card className="bg-white border-gray-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-700">Team Size</CardTitle>
          <Users className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">{teamSize}</div>
          <p className="text-xs text-gray-600 mt-1">Active sales reps</p>
        </CardContent>
      </Card>
    </div>
  )
}
