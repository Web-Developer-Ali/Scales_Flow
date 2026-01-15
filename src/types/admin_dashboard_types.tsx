export interface DashboardData {
  success: boolean;
  metrics: {
    totalPipeline: number;
    closedThisMonth: number;
    targetProgress: {
      closed: number;
      target: number;
      percent: number;
    };
    avgCloseTime: number;
  };
  pipelineByStage: Array<{
    stage: string;
    count: number;
    value: number;
  }>;
  teamPerformance: Array<{
    id: number;
    name: string;
    closed_deals: number;
    total_value: number;
  }>;
  recentDeals: Array<{
    id: number;
    company: string;
    contact: string;
    value: number;
    stage: string;
    probability: number;
    daysInStage: number;
    status: string;
  }>;
}

interface PipelineData {
  stage: string;
  count: number;
  value: number;
}

export interface DealPipelineProps {
  data?: PipelineData[];
  isLoading?: boolean;
}

interface Deal {
  id: number;
  company: string;
  contact: string;
  value: number;
  stage: string;
  probability: number;
  daysInStage: number;
  status: string;
}

export interface RecentDealsProps {
  data?: Deal[];
  isLoading?: boolean;
}

export interface SalesMetricsProps {
  totalPipeline?: number;
  closedThisMonth?: number;
  targetProgress?: { closed: number; target: number; percent: number };
  avgCloseTime?: number;
  isLoading?: boolean;
}

interface TeamMember {
  id: number;
  name: string;
  closed_deals: number;
  total_value: number;
}

export interface TeamPerformanceProps {
  data?: TeamMember[];
  isLoading?: boolean;
}
