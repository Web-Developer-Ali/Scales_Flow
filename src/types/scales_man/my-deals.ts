export interface Deal {
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
  days_in_stage: number;
  created_at: string;
  updated_at: string;
}

export interface DealsStats {
  totalDeals: number;
  totalPipeline: number;
  avgProbability: number;
  expectedRevenue: number;
  wonCount: number;
  activeCount: number;
}

export interface Filters {
  stage: string;
  status: string;
  search: string;
  sort: string;
}
