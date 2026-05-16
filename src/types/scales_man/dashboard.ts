export interface StageBreakdown {
  stage: string;
  deal_count: number;
  stage_value: number;
}

export interface RepDeal {
  id: string;
  title: string;
  company: string;
  contact: string | null;
  value: number;
  stage: string;
  status: string;
  probability: number;
  days_in_stage: number;
  created_at: string;
}

export interface NeedsAttentionDeal {
  id: string;
  title: string;
  company: string;
  value: number;
  stage: string;
  probability: number;
  days_stale: number;
  days_in_stage: number;
}

export interface MonthlyTrend {
  month_label: string;
  won_count: number;
  active_count: number;
}

export interface RepMetricsData {
  pipelineValue: number;
  closedValue: number;
  closedCount: number;
  avgCloseTime: number;
  hotLeads: number;
  target: number;
  targetPercent: number;
  pipelineDelta: number | null;
  closedDelta: number | null;
}

export interface RepDashboardData {
  month: string;
  metrics: RepMetricsData;
  stageBreakdown: StageBreakdown[];
  recentDeals: RepDeal[];
  needsAttention: NeedsAttentionDeal[];
  monthlyTrend: MonthlyTrend[];
}
