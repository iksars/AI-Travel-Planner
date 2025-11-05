import apiClient from './client'

export interface TravelPlan {
  id: string
  userId: string
  title: string
  destination: string
  startDate: string
  endDate: string
  budget: number
  peopleCount: number
  preferences?: string
  status: 'draft' | 'ongoing' | 'completed'
  aiGenerated: boolean
  createdAt: string
  updatedAt: string
  itineraries?: Itinerary[]
  expenses?: Expense[]
  _count?: {
    itineraries: number
    expenses: number
  }
}

export interface Itinerary {
  id: string
  travelPlanId: string
  day: number
  date: string
  activities: string
  transportation?: string
  accommodation?: string
  restaurants?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

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

export interface CreateTravelPlanRequest {
  title: string
  destination: string
  startDate: string
  endDate: string
  budget: number
  peopleCount: number
  preferences?: any
  aiGenerated?: boolean
}

export interface UpdateTravelPlanRequest {
  title?: string
  destination?: string
  startDate?: string
  endDate?: string
  budget?: number
  peopleCount?: number
  preferences?: any
  status?: 'draft' | 'ongoing' | 'completed'
}

/**
 * 获取所有旅行计划
 */
export const getTravelPlans = async (status?: string): Promise<{ travelPlans: TravelPlan[] }> => {
  const params = status ? { status } : {}
  const response = await apiClient.get<{ travelPlans: TravelPlan[] }>('/travel-plans', { params })
  return response.data
}

/**
 * 获取单个旅行计划
 */
export const getTravelPlan = async (id: string): Promise<{ travelPlan: TravelPlan }> => {
  const response = await apiClient.get<{ travelPlan: TravelPlan }>(`/travel-plans/${id}`)
  return response.data
}

/**
 * 创建旅行计划
 */
export const createTravelPlan = async (
  data: CreateTravelPlanRequest
): Promise<{ message: string; travelPlan: TravelPlan }> => {
  const response = await apiClient.post<{ message: string; travelPlan: TravelPlan }>(
    '/travel-plans',
    data
  )
  return response.data
}

/**
 * 更新旅行计划
 */
export const updateTravelPlan = async (
  id: string,
  data: UpdateTravelPlanRequest
): Promise<{ message: string; travelPlan: TravelPlan }> => {
  const response = await apiClient.put<{ message: string; travelPlan: TravelPlan }>(
    `/travel-plans/${id}`,
    data
  )
  return response.data
}

/**
 * 删除旅行计划
 */
export const deleteTravelPlan = async (id: string): Promise<{ message: string }> => {
  const response = await apiClient.delete<{ message: string }>(`/travel-plans/${id}`)
  return response.data
}
