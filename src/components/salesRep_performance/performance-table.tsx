import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type React from "react";

interface PerformanceTableProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  reps: SalesRep[];
  badgeColor: string;
  iconColor: string;
}

export function PerformanceTable({
  title,
  description,
  icon,
  reps,
  badgeColor,
  iconColor,
}: PerformanceTableProps) {
  return (
    <Card className="bg-white border-gray-200 mb-8">
      <CardHeader className="border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className={iconColor}>{icon}</div>
          <CardTitle className="text-gray-900">
            {title} ({reps.length})
          </CardTitle>
        </div>
        <CardDescription className="text-gray-600">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-200 hover:bg-transparent">
                <TableHead className="text-gray-700 font-semibold">
                  Rep Name
                </TableHead>
                <TableHead className="text-gray-700 font-semibold">
                  Total Revenue
                </TableHead>
                <TableHead className="text-gray-700 font-semibold">
                  Deals Closed
                </TableHead>
                <TableHead className="text-gray-700 font-semibold">
                  Avg Deal Size
                </TableHead>
                <TableHead className="text-gray-700 font-semibold">
                  Conversion Rate
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reps.map((rep) => (
                <TableRow
                  key={rep.id}
                  className="border-gray-200 hover:bg-gray-50"
                >
                  <TableCell className="text-gray-900 font-medium">
                    {rep.name}
                  </TableCell>
                  <TableCell className="text-gray-900">
                    ${(rep.totalRevenue / 1000).toFixed(1)}K
                  </TableCell>
                  <TableCell className="text-gray-900">{rep.deals}</TableCell>
                  <TableCell className="text-gray-900">
                    ${(rep.avgDealSize / 1000).toFixed(1)}K
                  </TableCell>
                  <TableCell>
                    <span
                      className={`${badgeColor} px-3 py-1 rounded-full text-sm font-medium`}
                    >
                      {rep.conversionRate}%
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
