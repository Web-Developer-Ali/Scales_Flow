export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  joinDate: string;
}

export interface Summary {
  totalTeamMembers: number;
  managers: number;
  salesReps: number;
}

export type ConfirmAction = "block" | "unblock" | "delete" | null;

export interface ConfirmState {
  open: boolean;
  action: ConfirmAction;
  memberId: string | null;
  memberName: string;
}
