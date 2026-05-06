// @/types/admin_dashboard_types.ts

export interface TargetProgress {
  closed: number;
  target: number;
  percent: number;
}

export interface SalesMetricsProps {
  totalPipeline?: number;
  closedThisMonth?: number;
  targetProgress?: TargetProgress;
  avgCloseTime?: number;
  pipelineDelta?: number | null; // real % change vs last month
  closedDelta?: number | null; // real % change vs last month
  isLoading?: boolean;
}

export interface PipelineStage {
  stage: string; // lowercase — matches DB enum: prospect | qualified | demo | negotiation | closed
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
  total_value: number; // snake_case — direct from API
}

export interface TeamPerformanceProps {
  data?: TeamMember[];
  isLoading?: boolean;
}

export interface RecentDeal {
  id: string;
  company: string;
  contact: string | null; // contact_person aliased as contact in SQL
  value: number;
  status: string;
  stage: string; // lowercase — matches DB enum
  probability: number;
  days_in_stage: number; // computed in SQL: EXTRACT(EPOCH FROM ...) / 86400
  assigned_to: string | null;
  created_at: string;
}

export interface RecentDealsProps {
  data?: RecentDeal[];
  isLoading?: boolean;
}

// Shape of the full API response from /api/admin/dashboard
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
