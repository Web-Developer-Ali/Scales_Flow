// @/types/admin_dashboard_types.ts

export interface TargetProgress {
  closed: number; // remove optional + null — these always come from API
  total: number; // was "target" hardcoded, now real count
  percent: number;
}

export interface SalesMetricsProps {
  totalPipeline?: number;
  closedThisMonth?: number;
  targetProgress?: TargetProgress; // the prop itself is optional (loading state)
  avgCloseTime?: number;
  pipelineDelta?: number | null;
  closedDelta?: number | null;
  isLoading?: boolean;
}

export interface PipelineStage {
  stage: string;
  count: number;
}

export interface DealPipelineProps {
  data?: PipelineStage[];
  isLoading?: boolean;
}

export interface TeamMember {
  id: string;
  name: string;
  closed_deals: number;
  total_value: number;
  total_assigned: number;
}

export interface TeamPerformanceProps {
  data?: TeamMember[];
  isLoading?: boolean;
}

export interface RecentDeal {
  id: string;
  company: string;
  contact: string | null;
  value: number;
  status: string;
  stage: string;
  probability: number;
  days_in_stage: number;
  assigned_to: string | null;
  created_at: string;
}

export interface RecentDealsProps {
  data?: RecentDeal[];
  isLoading?: boolean;
}

export interface DashboardMetrics {
  totalPipeline: number;
  closedThisMonth: number;
  avgCloseTime: number;
  targetProgress: TargetProgress;
  pipelineDelta: number | null;
  closedDelta: number | null;
}

export interface DashboardApiResponse {
  success: boolean;
  month: string;
  metrics: DashboardMetrics;
  pipelineByStage: PipelineStage[];
  teamPerformance: TeamMember[];
  recentDeals: RecentDeal[];
}
