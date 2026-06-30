export interface MonthlyPerformance {
  month_label: string;
  generated_month: string;
  total_deals: number;
  won_deals: number;
  lost_deals: number;
  active_deals: number;
  revenue: number;
  pipeline: number;
  avg_deal_size: number;
  avg_close_days: number | null;
  win_rate: number;
}

export interface AllTimeStats {
  total_deals: number;
  total_won: number;
  total_lost: number;
  total_active: number;
  total_revenue: number;
  total_pipeline: number;
  avg_deal_size: number;
  avg_close_days: number;
  win_rate: number;
}

export interface ThisMonthStats {
  total_created: number;
  total_won: number;
  revenue: number;
}

export interface BestMonth {
  month_label: string;
  revenue: number;
}

export interface PerfStageBreakdown {
  stage: string;
  count: number;
  stage_value: number;
}

export interface RepPerformanceData {
  allTime: AllTimeStats;
  thisMonth: ThisMonthStats;
  bestMonth: BestMonth | null;
  monthlyPerformance: MonthlyPerformance[];
  stageBreakdown: PerfStageBreakdown[];
}
