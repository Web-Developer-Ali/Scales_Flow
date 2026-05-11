// ── Matches DB enum exactly ────────────────────────────────────────────────────
export const STAGES = [
  { value: "prospect", label: "Prospect" },
  { value: "qualified", label: "Qualified" },
  { value: "demo", label: "Demo" },
  { value: "negotiation", label: "Negotiation" },
  { value: "closed", label: "Closed" },
] as const;

// Default probability per stage — auto-fills when stage changes
export const STAGE_PROBABILITY: Record<string, number> = {
  prospect: 10,
  qualified: 30,
  demo: 50,
  negotiation: 75,
  closed: 100,
};

export const CURRENCIES = [
  { value: "USD", label: "USD ($)" },
  { value: "EUR", label: "EUR (€)" },
  { value: "GBP", label: "GBP (£)" },
  { value: "CAD", label: "CAD (C$)" },
  { value: "AUD", label: "AUD (A$)" },
] as const;

export interface FormData {
  title: string;
  company: string;
  contact_person: string;
  contact_email: string;
  contact_phone: string;
  value: string;
  stage: string;
  probability: string;
  expected_close_date: string;
  description: string;
  currency: string;
}

export interface ValidationState {
  title: boolean | null;
  company: boolean | null;
  contact_email: boolean | null;
  value: boolean | null;
  expected_close_date: boolean | null;
}

export const INITIAL_FORM: FormData = {
  title: "",
  company: "",
  contact_person: "",
  contact_email: "",
  contact_phone: "",
  value: "",
  stage: "prospect",
  probability: "10",
  expected_close_date: "",
  description: "",
  currency: "USD",
};

export const INITIAL_VALIDATION: ValidationState = {
  title: null,
  company: null,
  contact_email: null,
  value: null,
  expected_close_date: null,
};
