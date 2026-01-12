"use client";
import { MONTHS } from "@/app/(Route_pages)/salesRep_performance/page";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MonthFilterProps {
  selectedMonth: string;
  onMonthChange: (month: string) => void;
}

export function MonthFilter({
  selectedMonth,
  onMonthChange,
}: MonthFilterProps) {
  return (
    <div className="mb-8 flex gap-4 items-center">
      <label className="text-gray-700 font-medium">Filter by Month:</label>
      <Select value={selectedMonth} onValueChange={onMonthChange}>
        <SelectTrigger className="w-48 bg-white border-gray-300 text-gray-900">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-white border-gray-300">
          {MONTHS.map((month) => (
            <SelectItem
              key={month.value}
              value={month.value}
              className="text-gray-900"
            >
              {month.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
