export interface Budget {
  id: string;
  period: string; // YYYY-MM
  costCenter: string;
  amount: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}
