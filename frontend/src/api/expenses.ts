import apiClient from './client'

export interface Expense {
  id: string
  travelPlanId: string
  category: string
  amount: number
  currency: string
  description?: string
  date: string
  createdAt: string
}

export interface CreateExpenseInput {
  travelPlanId: string
  category: string
  amount: number
  currency?: string
  description?: string
  date?: string
}

export interface UpdateExpenseInput {
  category?: string
  amount?: number
  currency?: string
  description?: string
  date?: string
}

export interface CategoryStat {
  category: string
  totalAmount: number
  count: number
  percentage: number
}

export interface BudgetAnalysis {
  totalBudget: number
  totalSpent: number
  remaining: number
  percentageUsed: number
  categoryBreakdown: CategoryStat[]
  dailySpending: {
    date: string
    amount: number
  }[]
  recentExpenses: Expense[]
}

/**
 * 获取旅行计划的所有费用记录
 */
export async function getExpenses(travelPlanId: string): Promise<{ expenses: Expense[] }> {
  const response = await apiClient.get(`/expenses?travelPlanId=${travelPlanId}`)
  return response.data
}

/**
 * 创建新的费用记录
 */
export async function createExpense(input: CreateExpenseInput): Promise<{ expense: Expense }> {
  const response = await apiClient.post('/expenses', input)
  return response.data
}

/**
 * 获取单个费用记录
 */
export async function getExpense(id: string): Promise<{ expense: Expense }> {
  const response = await apiClient.get(`/expenses/${id}`)
  return response.data
}

/**
 * 更新费用记录
 */
export async function updateExpense(id: string, input: UpdateExpenseInput): Promise<{ expense: Expense }> {
  const response = await apiClient.put(`/expenses/${id}`, input)
  return response.data
}

/**
 * 删除费用记录
 */
export async function deleteExpense(id: string): Promise<{ message: string }> {
  const response = await apiClient.delete(`/expenses/${id}`)
  return response.data
}

/**
 * 获取旅行计划的预算分析
 */
export async function getBudgetAnalysis(travelPlanId: string): Promise<{ analysis: BudgetAnalysis }> {
  const response = await apiClient.get(`/travel-plans/${travelPlanId}/budget-analysis`)
  return response.data
}

// 费用分类常量
export const EXPENSE_CATEGORIES = [
  { value: '交通', label: '交通', icon: '🚗' },
  { value: '住宿', label: '住宿', icon: '🏨' },
  { value: '餐饮', label: '餐饮', icon: '🍽️' },
  { value: '景点门票', label: '景点门票', icon: '🎫' },
  { value: '购物', label: '购物', icon: '🛍️' },
  { value: '娱乐', label: '娱乐', icon: '🎮' },
  { value: '其他', label: '其他', icon: '💰' },
]

export function getCategoryIcon(category: string): string {
  const cat = EXPENSE_CATEGORIES.find(c => c.value === category)
  return cat?.icon || '💰'
}
