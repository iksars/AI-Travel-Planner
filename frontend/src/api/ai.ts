import apiClient from './client'
import type { TravelPlan } from './travelPlans'

export interface AIGenerateRequest {
  destination: string
  days: number
  budget: number
  peopleCount: number
  startDate: string
  preferences?: string[]
  otherRequirements?: string
}

export interface AIGenerateResponse {
  message: string
  travelPlan: TravelPlan
  aiPlan: {
    title: string
    destination: string
    totalDays: number
    totalBudget: number
    itineraries: any[]
    tips: string[]
    warnings?: string[]
  }
}

/**
 * 使用 AI 生成旅行计划
 */
export const generateItinerary = async (
  data: AIGenerateRequest
): Promise<AIGenerateResponse> => {
  // 增加超时时间到 60 秒
  const response = await apiClient.post<AIGenerateResponse>(
    '/ai/generate-itinerary', 
    data,
    {
      timeout: 60000 * 10, // 10 分钟超时
    }
  )
  return response.data
}
