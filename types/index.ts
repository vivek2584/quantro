export type ExpenseCategory = 'food' | 'transportation' | 'entertainment' | 'education' | 'shopping' | 'bills' | 'other' | string;

export interface Expense {
  id?: string;
  amount: number;
  description: string;
  category: string;
  date: Date | string;
  userId: string;
  createdAt?: Date | string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  budget?: number;
  userId: string;
}

export interface Budget {
  id?: string;
  userId: string;
  monthlyBudget: number;
  categories: { [categoryId: string]: number };
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface ExpenseSummary {
  total: number;
  categoryBreakdown: Record<string, number>;
  monthlyData: Array<{ month: string; amount: number }>;
}

export interface UserProfile {
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  monthlyBudget?: number;
  currency?: string;
}

export interface SavingsGoal {
  id?: string;
  userId: string;
  goalName: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: Date | string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}
