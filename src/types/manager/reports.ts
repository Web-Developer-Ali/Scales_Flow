export interface ManagerMonthlyStat {
  month_label: string;
  generated_month: string;
  won_revenue: number;
  pipeline_value: number;
  total_deals: number;
  won_deals: number;
  lost_deals: number;
}

export interface RepStat {
  id: string;
  name: string;
  role: string;
  total_deals: number;
  won_deals: number;
  lost_deals: number;
  active_deals: number;
  total_revenue: number;
  pipeline_value: number;
  avg_close_days: number | null;
  win_rate: number;
}

export interface FastestCloser {
  id: string;
  name: string;
  avg_close_days: number;
  won_this_month: number;
}

export interface ManagerFunnelStage {
  stage: string;
  total: number;
  won: number;
  active: number;
  lost: number;
}

export interface ManagerPipelineHealth {
  stage: string;
  deal_count: number;
  stage_value: number;
  avg_days_in_stage: number;
}

export interface ManagerReportSummary {
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

export interface ManagerMonthSnapshot {
  revenue: number;
  pipeline: number;
  won_count: number;
  total_count?: number;
}

export interface ManagerReportsData {
  teamSize: number;
  summary: ManagerReportSummary;
  thisMonth: ManagerMonthSnapshot;
  lastMonth: ManagerMonthSnapshot;
  monthlyRevenue: ManagerMonthlyStat[];
  repComparison: RepStat[];
  funnel: ManagerFunnelStage[];
  pipelineHealth: ManagerPipelineHealth[];
  fastestClosers: FastestCloser[];
}
