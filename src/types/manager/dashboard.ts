export interface RepPerformance {
  id: string;
  name: string;
  closed_deals: number;
  total_assigned: number;
  total_value: number;
}

export interface MyDeal {
  id: string;
  title: string;
  company: string;
  value: number;
  stage: string;
  probability: number;
  status: string;
  days_in_stage: number;
}

export interface TeamRecentDeal {
  id: string;
  company: string;
  contact: string | null;
  value: number;
  stage: string;
  status: string;
  probability: number;
  rep_name: string;
  days_in_stage: number;
  updated_at: string;
}

export interface ManagerDashboardData {
  month: string;
  personal: {
    pipeline: number;
    closedValue: number;
    closedCount: number;
    avgCloseTime: number;
    deals: MyDeal[];
  };
  team: {
    size: number;
    pipeline: number;
    closedValue: number;
    closedCount: number;
    totalCreated: number;
    targetPercent: number;
    pipelineDelta: number | null;
    closedDelta: number | null;
  };
  repPerformance: RepPerformance[];
  teamRecent: TeamRecentDeal[];
}
