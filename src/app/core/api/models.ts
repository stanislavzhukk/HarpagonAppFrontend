export type CategoryType = 'Income' | 'Expense';

export interface UserData {
  id: string;
  email: string;
  name: string;
  surname: string;
  emailConfirmed: boolean | null;
  userRole: string | null;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: UserData;
}

export interface RefreshResponse {
  accessToken: string;
  user: UserData;
}

export interface Account {
  id: string;
  userId: string | null;
  name: string;
  balance: number;
  goal: number;
}

export interface Category {
  id: string;
  ownerId: string | null;
  name: string;
  description: string | null;
  type: CategoryType;
}

export interface Transaction {
  id: string;
  amount: number;
  date: string;
  description: string;
  category: Category | null;
  account: Account | null;
}

export interface DataTable<T> {
  draw: number;
  recordsTotal: number;
  recordsFiltered: number;
  data: T[];
}

export interface Dashboard {
  name: string;
  transactionsCount: number;
  totalExpenses: number;
  totalIncomes: number;
  currentTotalBalance: number;
  lastUpdated: string;
  expensesByCategory: Record<string, number>;
  incomesByCategory: Record<string, number>;
}

export interface MessageResponse {
  message?: string;
}
