export interface ManagerDeal {
  id: string;
  title: string;
  company: string;
  contact_person: string | null;
  contact_email: string | null;
  value: number;
  stage: string;
  status: string;
  probability: number;
  expected_close_date: string | null;
  description: string | null;
  assigned_to: string;
  rep_name: string;
  rep_email: string;
  days_in_stage: number;
  created_at: string;
  updated_at: string;
}

export interface RepSummary {
  id: string;
  name: string;
  total_deals: number;
  active_deals: number;
  won_deals: number;
  pipeline_value: number;
}

export interface ManagerDealsStats {
  totalDeals: number;
  totalPipeline: number;
  avgProbability: number;
  expectedRevenue: number;
  wonCount: number;
  activeCount: number;
  lostCount: number;
}

export interface ManagerDealsFilters {
  stage: string;
  status: string;
  search: string;
  rep: string;
  sort: string;
}
