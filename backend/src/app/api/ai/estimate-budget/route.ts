import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/middleware/auth';
import { addCorsHeaders, corsMiddleware } from '@/lib/cors';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
  baseURL: process.env.AI_API_URL,
});

export async function OPTIONS(request: NextRequest) {
  const response = corsMiddleware(request);
  return response || new NextResponse(null, { status: 200 });
}

export interface BudgetEstimateInput {
  destination: string;
  days: number;
  peopleCount: number;
  preferences?: string[];
  travelStyle?: 'budget' | 'moderate' | 'luxury';
}

export interface BudgetBreakdown {
  category: string;
  estimatedAmount: number;
  percentage: number;
  description: string;
}

export interface BudgetEstimate {
  totalEstimate: number;
  perPersonEstimate: number;
  breakdown: BudgetBreakdown[];
  tips: string[];
  savingTips: string[];
}

/**
 * POST /api/ai/estimate-budget
 * 使用 AI 估算旅行预算
 */
async function postHandler(req: AuthenticatedRequest) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      const response = NextResponse.json(
        { error: 'User ID not found in token' },
        { status: 400 }
      );
      return addCorsHeaders(response, req);
    }

    const body = await req.json();
    const { destination, days, peopleCount, preferences, travelStyle = 'moderate' } = body as BudgetEstimateInput;

    // 验证必填参数
    if (!destination || !days || !peopleCount) {
      const response = NextResponse.json(
        { error: 'Missing required fields: destination, days, peopleCount' },
        { status: 400 }
      );
      return addCorsHeaders(response, req);
    }

    // 构建 AI Prompt
    const prompt = buildBudgetPrompt({ destination, days, peopleCount, preferences, travelStyle });

    // 调用 AI 生成预算估算
    const isZhipuAI = process.env.AI_API_URL?.includes('bigmodel.cn');
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

    const requestParams: any = {
      model: model,
      messages: [
        {
          role: 'system',
          content: `你是一位专业的旅行预算顾问，擅长为旅客提供准确、实用的预算估算。

重要规则：
1. 必须返回有效的 JSON 格式
2. JSON 必须包含：totalEstimate, perPersonEstimate, breakdown, tips, savingTips
3. breakdown 必须是数组，每项包含：category, estimatedAmount, percentage, description
4. 所有金额使用人民币（CNY）
5. 确保 breakdown 中各项 percentage 总和为 100
6. 提供实用的省钱建议`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
    };

    if (!isZhipuAI) {
      requestParams.response_format = { type: 'json_object' };
    }

    const completion = await openai.chat.completions.create(requestParams);

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('AI did not return any content');
    }

    let budgetEstimate: BudgetEstimate;
    try {
      budgetEstimate = JSON.parse(content);
    } catch (parseError) {
      // 尝试提取 JSON
      const firstBrace = content.indexOf('{');
      const lastBrace = content.lastIndexOf('}');
      
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        const jsonStr = content.substring(firstBrace, lastBrace + 1);
        budgetEstimate = JSON.parse(jsonStr);
      } else {
        throw new Error('Failed to parse AI response as JSON');
      }
    }

    const response = NextResponse.json({
      success: true,
      estimate: budgetEstimate,
    });
    return addCorsHeaders(response, req);
  } catch (error) {
    console.error('Budget estimation error:', error);
    const response = NextResponse.json(
      { 
        error: 'Failed to estimate budget',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
    return addCorsHeaders(response, req);
  }
}

export const POST = withAuth(postHandler);

function buildBudgetPrompt(input: BudgetEstimateInput): string {
  const { destination, days, peopleCount, preferences = [], travelStyle = 'moderate' } = input;

  const styleDescriptions = {
    budget: '经济实惠，注重性价比',
    moderate: '中等消费，舒适与性价比平衡',
    luxury: '高端奢华，追求极致体验',
  };

  const preferencesText = preferences.length > 0
    ? `旅行偏好：${preferences.join('、')}`
    : '';

  return `
请为以下旅行需求估算预算：

目的地: ${destination}
旅行天数: ${days} 天
人数: ${peopleCount} 人
旅行风格: ${styleDescriptions[travelStyle]}
${preferencesText}

请直接返回 JSON 格式的预算估算，不要添加任何解释性文字。JSON 结构如下：

{
  "totalEstimate": 总预算金额（数字，人民币）,
  "perPersonEstimate": 人均预算（数字，人民币）,
  "breakdown": [
    {
      "category": "交通",
      "estimatedAmount": 金额,
      "percentage": 占比百分比（如25表示25%）,
      "description": "包括往返机票/火车票、当地交通等"
    },
    {
      "category": "住宿",
      "estimatedAmount": 金额,
      "percentage": 占比百分比,
      "description": "酒店或民宿住宿费用"
    },
    {
      "category": "餐饮",
      "estimatedAmount": 金额,
      "percentage": 占比百分比,
      "description": "三餐及小吃费用"
    },
    {
      "category": "景点门票",
      "estimatedAmount": 金额,
      "percentage": 占比百分比,
      "description": "景区门票及游乐项目"
    },
    {
      "category": "购物娱乐",
      "estimatedAmount": 金额,
      "percentage": 占比百分比,
      "description": "购物、娱乐等其他开支"
    }
  ],
  "tips": [
    "预算建议1",
    "预算建议2",
    "预算建议3"
  ],
  "savingTips": [
    "省钱技巧1",
    "省钱技巧2",
    "省钱技巧3"
  ]
}

注意事项：
1. 预算要符合${destination}的实际消费水平
2. 考虑${travelStyle}的旅行风格
3. breakdown 各项百分比总和必须为 100
4. 所有金额为数字类型，单位为人民币
5. 提供实用的预算建议和省钱技巧
`;
}
