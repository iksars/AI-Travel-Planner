/**
 * 从用户语音文本中提取结构化旅行计划数据，并返回原始文本和结构化结果
 * @param text 用户语音转文字结果
 * @returns { text: string, plan: TravelInput|null, error?: string }
 */
export async function extractTravelPlanFromTextWithRaw(text: string): Promise<{ text: string, plan: TravelInput|null, error?: string }> {
  try {
    const plan = await extractTravelPlanFromText(text);
    return { text, plan };
  } catch (error: any) {
    return { text, plan: null, error: error.message || '解析失败' };
  }
}
/**
 * 从用户语音文本中提取结构化旅行计划数据
 * @param text 用户语音转文字结果
 * @returns TravelInput 结构
 */
export async function extractTravelPlanFromText(text: string): Promise<TravelInput> {
  // 构造提示词，要求 LLM 只提取结构化字段
  const prompt = `请从以下用户描述中提取详细的旅行计划信息，并严格按照以下要求返回 JSON 格式。

**JSON 结构和字段说明:**
- \`destination\` (string): 目的地，例如 "北京", "云南大理"。
- \`startDate\` (string): 出发日期，格式为 "YYYY-MM-DD"。如果用户提到相对日期（如“下周三”），请根据当前日期（${new Date().toISOString().split('T')[0]}）计算出具体日期。
- \`days\` (number): 旅行天数，必须是 1 到 30 之间的整数。
- \`budget\` (number): 总预算金额，数字类型。
- \`peopleCount\` (number): 人数，必须是大于等于 1 的整数。
- \`preferences\` (string[]): 旅行偏好，一个字符串数组。请从以下预设选项中选择匹配的项：["自然风光", "历史文化", "美食探索", "购物休闲", "冒险刺激", "亲子活动", "摄影打卡", "休闲度假"]。
- \`otherRequirements\` (string): 其他要求，任何未包含在上述字段中的用户需求。

**输出要求:**
1.  只返回 JSON 对象，不要包含任何解释、注释或额外的文本。
2.  如果某个字段在用户描述中没有提到，请在 JSON 中省略该字段，不要使用 null 或空字符串。
3.  严格遵守字段名称和数据类型。

**用户描述：**
${text}`;

  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const isZhipuAI = process.env.AI_API_URL?.includes('bigmodel.cn');
  const requestParams: any = {
    model,
    messages: [
      { role: 'system', content: '你是一位专业的旅行助手，擅长从用户自然语言中提取结构化旅行计划信息。' },
      { role: 'user', content: prompt },
    ],
    temperature: 0.2,
  };
  if (!isZhipuAI) {
    requestParams.response_format = { type: 'json_object' };
  }
  const completion = await openai.chat.completions.create(requestParams);
  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error('AI未返回内容');
  let result: TravelInput;
  try {
    result = JSON.parse(content);
  } catch {
    // 容错：尝试提取 JSON
    const firstBrace = content.indexOf('{');
    const lastBrace = content.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      result = JSON.parse(content.substring(firstBrace, lastBrace + 1));
    } else {
      throw new Error('AI返回内容无法解析为JSON');
    }
  }
  return result;
}
import OpenAI from 'openai';

// 初始化 OpenAI 客户端
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
  // 如果使用国内代理或其他兼容 OpenAI 的服务，可以设置 baseURL
  baseURL: process.env.AI_API_URL,
});

export interface TravelInput {
  destination: string;
  days: number;
  budget: number;
  peopleCount: number;
  startDate: string;
  preferences?: string[];
  otherRequirements?: string;
}

export interface GeneratedItinerary {
  day: number;
  date: string;
  title: string;
  activities: Activity[];
  transportation?: string;
  accommodation?: AccommodationInfo;
  restaurants?: RestaurantInfo[];
  estimatedCost: number;
  notes?: string;
}

export interface Activity {
  time: string;
  name: string;
  description: string;
  location: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  duration: string;
  cost: number;
  type: 'attraction' | 'restaurant' | 'transportation' | 'accommodation' | 'other';
}

export interface AccommodationInfo {
  name: string;
  type: string;
  location: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  estimatedCost: number;
}

export interface RestaurantInfo {
  name: string;
  cuisine: string;
  location: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  estimatedCost: number;
  recommendedDishes?: string[];
}

export interface GeneratedPlan {
  title: string;
  destination: string;
  totalDays: number;
  totalBudget: number;
  itineraries: GeneratedItinerary[];
  tips: string[];
  warnings?: string[];
}

/**
 * 使用 AI 生成旅行行程
 */
export async function generateTravelItinerary(
  input: TravelInput
): Promise<GeneratedPlan> {
  const prompt = buildPrompt(input);

  try {
    // 智谱 AI 的模型配置
    const isZhipuAI = process.env.AI_API_URL?.includes('bigmodel.cn');
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    
    const requestParams: any = {
      model: model,
      messages: [
        {
          role: 'system',
          content: `你是一位专业的旅行规划师，擅长为旅客制定详细、实用且个性化的旅行计划。

重要规则：
1. 必须返回有效的 JSON 格式，不要添加任何其他文本或解释
2. JSON 必须包含以下顶层字段：title, destination, totalDays, totalBudget, itineraries, tips
3. itineraries 必须是数组，长度等于旅行天数
4. 每个 itinerary 必须包含：day, date, title, activities, estimatedCost
5. activities 必须是数组，每个活动包含：time, name, description, location, duration, cost, type
6. 所有坐标使用格式：{"lat": 纬度数字, "lng": 经度数字}
7. 确保所有数字字段都是数字类型，不要用字符串
8. 确保返回的是完整的 JSON 对象，不要截断

你需要根据用户的需求，生成包含每日行程、景点推荐、交通方式、住宿建议、餐厅推荐的完整旅行计划。`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
    };

    // OpenAI 官方 API 支持 response_format，智谱 AI 不支持
    if (!isZhipuAI) {
      requestParams.response_format = { type: 'json_object' };
    }

    console.log('Using AI provider:', isZhipuAI ? 'ZhipuAI (GLM)' : 'OpenAI');
    console.log('Model:', model);

    const completion = await openai.chat.completions.create(requestParams);

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('AI did not return any content');
    }

    console.log('AI Response (first 500 chars):', content.substring(0, 500));
    
    let generatedPlan: any;
    try {
      // 尝试直接解析
      generatedPlan = JSON.parse(content);
    } catch (parseError) {
      // 如果失败，尝试提取 JSON（智谱 AI 可能会添加额外文本）
      console.log('Direct JSON parse failed, trying to extract JSON...');
      
      // 查找第一个 { 和最后一个 }
      const firstBrace = content.indexOf('{');
      const lastBrace = content.lastIndexOf('}');
      
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        const jsonStr = content.substring(firstBrace, lastBrace + 1);
        console.log('Extracted JSON:', jsonStr.substring(0, 200));
        
        try {
          generatedPlan = JSON.parse(jsonStr);
        } catch (extractError) {
          console.error('JSON Parse Error:', extractError);
          console.error('Raw content:', content);
          throw new Error('Failed to parse AI response as JSON');
        }
      } else {
        console.error('JSON Parse Error:', parseError);
        console.error('Raw content:', content);
        throw new Error('Failed to parse AI response as JSON');
      }
    }

    // 容错处理：确保基本结构存在
    if (!generatedPlan.title) {
      generatedPlan.title = `${input.destination}${input.days}日游`;
    }
    if (!generatedPlan.destination) {
      generatedPlan.destination = input.destination;
    }
    if (!generatedPlan.totalDays) {
      generatedPlan.totalDays = input.days;
    }
    if (!generatedPlan.totalBudget) {
      generatedPlan.totalBudget = input.budget;
    }
    if (!generatedPlan.tips) {
      generatedPlan.tips = [];
    }
    if (!generatedPlan.itineraries) {
      generatedPlan.itineraries = [];
    }
    
    // 验证生成的计划
    validateGeneratedPlan(generatedPlan as GeneratedPlan, input);
    
    return generatedPlan as GeneratedPlan;
  } catch (error) {
    console.error('AI generation error:', error);
    if (error instanceof Error) {
      throw error; // 保留原始错误信息
    }
    throw new Error('Failed to generate travel itinerary');
  }
}

/**
 * 构建发送给 AI 的提示词
 */
function buildPrompt(input: TravelInput): string {
  const {
    destination,
    days,
    budget,
    peopleCount,
    startDate,
    preferences = [],
    otherRequirements = '',
  } = input;

  const preferencesText = preferences.length > 0
    ? `旅行偏好：${preferences.join('、')}`
    : '';

  return `
请为以下旅行需求生成一份详细的旅行计划。

目的地: ${destination}
出发日期: ${startDate}
旅行天数: ${days} 天
总预算: ¥${budget}
人数: ${peopleCount} 人
${preferencesText}
${otherRequirements ? `其他要求: ${otherRequirements}` : ''}

请直接返回 JSON 格式的旅行计划，不要添加任何解释性文字。JSON 结构如下：

{
  "title": "${destination}${days}日游旅行计划",
  "destination": "${destination}",
  "totalDays": ${days},
  "totalBudget": ${budget},
  "itineraries": [
    {
      "day": 1,
      "date": "2025-11-05",
      "title": "第1天行程",
      "activities": [
        {
          "time": "09:00",
          "name": "景点名称",
          "description": "景点描述",
          "location": "具体地址",
          "coordinates": {"lat": 39.9, "lng": 116.4},
          "duration": "2小时",
          "cost": 100,
          "type": "attraction"
        }
      ],
      "transportation": "交通建议",
      "accommodation": {
        "name": "酒店名",
        "type": "酒店类型",
        "location": "地址",
        "coordinates": {"lat": 39.9, "lng": 116.4},
        "estimatedCost": 300
      },
      "restaurants": [
        {
          "name": "餐厅名",
          "cuisine": "菜系",
          "location": "地址",
          "coordinates": {"lat": 39.9, "lng": 116.4},
          "estimatedCost": 100,
          "recommendedDishes": ["菜品1", "菜品2"]
        }
      ],
      "estimatedCost": 500,
      "notes": "备注"
    }
  ],
  "tips": ["建议1", "建议2"],
  "warnings": ["注意1", "注意2"]
}

注意事项：
1. 必须生成完整的 ${days} 天行程
2. 每天至少包含 2-3 个景点活动
3. 坐标使用${destination}真实的经纬度
4. type 可选: attraction, restaurant, transportation, accommodation, other
5. 所有数字字段必须是数字类型
6. 确保总预算不超过 ¥${budget}
`;
}

/**
 * 验证生成的计划
 */
function validateGeneratedPlan(plan: GeneratedPlan, input: TravelInput): void {
  console.log('Validating plan structure...', {
    hasTitle: !!plan.title,
    hasItineraries: !!plan.itineraries,
    itinerariesLength: plan.itineraries?.length || 0,
    expectedDays: input.days
  });

  if (!plan.title || !plan.itineraries || plan.itineraries.length === 0) {
    console.error('Invalid plan structure:', {
      title: plan.title,
      hasItineraries: !!plan.itineraries,
      itinerariesLength: plan.itineraries?.length,
      planKeys: Object.keys(plan)
    });
    throw new Error('Invalid plan structure: missing title or itineraries');
  }

  if (plan.itineraries.length !== input.days) {
    console.warn(
      `Generated ${plan.itineraries.length} days, expected ${input.days} days`
    );
  }

  // 验证预算
  const totalCost = plan.itineraries.reduce(
    (sum, itinerary) => sum + (itinerary.estimatedCost || 0),
    0
  );

  if (totalCost > input.budget * 1.2) {
    console.warn(`Estimated cost ${totalCost} exceeds budget ${input.budget} significantly`);
  }
}

/**
 * 测试 AI 连接
 */
export async function testAIConnection(): Promise<boolean> {
  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: 'Hello, this is a test. Please respond with "OK".',
        },
      ],
      max_tokens: 10,
    });

    return completion.choices[0]?.message?.content?.includes('OK') || false;
  } catch (error) {
    console.error('AI connection test failed:', error);
    return false;
  }
}
