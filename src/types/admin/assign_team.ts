export interface Manager {
  id: string;
  name: string;
  email: string;
}

export interface Rep {
  id: string;
  name: string;
  email: string;
  manager_id: string | null;
  is_active: boolean;
}
