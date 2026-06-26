export interface MonthlyStat {
  month_label: string;
  generated_month: string;
  won_revenue: number;
  pipeline_value: number;
  total_deals: number;
  won_deals: number;
  lost_deals: number;
}

export interface TopRep {
  id: string;
  name: string;
  role: string;
  total_deals: number;
  won_deals: number;
  lost_deals: number;
  total_revenue: number;
  pipeline_value: number;
  avg_close_days: number | null;
  win_rate: number;
}

export interface FunnelStage {
  stage: string;
  total: number;
  won: number;
  active: number;
  lost: number;
}

export interface PipelineStageHealth {
  stage: string;
  deal_count: number;
  stage_value: number;
  avg_days_in_stage: number;
}

export interface ReportSummary {
  total_deals: number;
  total_won: number;
  total_lost: number;
  total_active: number;
  total_revenue: number;
  total_pipeline: number;
  avg_deal_size: number;
  avg_close_days: number;
  overall_win_rate: number;
}

export interface MonthSnapshot {
  revenue: number;
  pipeline: number;
  won_count: number;
  total_count?: number;
}

export interface AdminReportsData {
  summary: ReportSummary;
  thisMonth: MonthSnapshot;
  lastMonth: MonthSnapshot;
  monthlyRevenue: MonthlyStat[];
  topReps: TopRep[];
  funnel: FunnelStage[];
  pipelineHealth: PipelineStageHealth[];
}
