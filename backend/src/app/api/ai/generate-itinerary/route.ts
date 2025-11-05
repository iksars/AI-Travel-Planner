import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/middleware/auth';
import { corsMiddleware, addCorsHeaders } from '@/lib/cors';
import { generateTravelItinerary, type TravelInput } from '@/lib/ai';

// 配置路由超时时间（秒）
export const maxDuration = 60 * 10; // 增加到 10 分钟
export const dynamic = 'force-dynamic'; // 禁用静态优化

export async function OPTIONS(request: NextRequest) {
  const response = corsMiddleware(request);
  return response || new NextResponse(null, { status: 200 });
}

/**
 * POST - 使用 AI 生成旅行计划
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
    const {
      destination,
      days,
      budget,
      peopleCount,
      startDate,
      preferences,
      otherRequirements,
    } = body;

    // 验证必填字段
    if (!destination || !days || !budget || !peopleCount || !startDate) {
      const response = NextResponse.json(
        { error: 'Missing required fields: destination, days, budget, peopleCount, startDate' },
        { status: 400 }
      );
      return addCorsHeaders(response, req);
    }

    // 验证 OpenAI API Key
    if (!process.env.OPENAI_API_KEY) {
      const response = NextResponse.json(
        { error: 'AI service not configured. Please set OPENAI_API_KEY.' },
        { status: 503 }
      );
      return addCorsHeaders(response, req);
    }

    // 构建 AI 输入
    const aiInput: TravelInput = {
      destination,
      days: parseInt(days),
      budget: parseFloat(budget),
      peopleCount: parseInt(peopleCount),
      startDate,
      preferences: preferences || [],
      otherRequirements: otherRequirements || '',
    };

    console.log(`Starting AI generation for ${destination}, ${days} days...`);
    const startTime = Date.now();

    // 调用 AI 生成行程
    const generatedPlan = await generateTravelItinerary(aiInput);

    const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`AI generation completed in ${elapsedTime}s`);

    // 计算结束日期
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(start.getDate() + parseInt(days) - 1);

    // 创建旅行计划
    const travelPlan = await prisma.travelPlan.create({
      data: {
        userId,
        title: generatedPlan.title,
        destination: generatedPlan.destination,
        startDate: start,
        endDate: end,
        budget: parseFloat(budget),
        peopleCount: parseInt(peopleCount),
        preferences: JSON.stringify(preferences || []),
        aiGenerated: true,
        status: 'draft',
        itineraries: {
          create: generatedPlan.itineraries.map((itinerary) => ({
            day: itinerary.day,
            date: new Date(itinerary.date),
            activities: JSON.stringify(itinerary.activities),
            transportation: itinerary.transportation || null,
            accommodation: itinerary.accommodation
              ? JSON.stringify(itinerary.accommodation)
              : null,
            restaurants: itinerary.restaurants
              ? JSON.stringify(itinerary.restaurants)
              : null,
            notes: [
              ...(itinerary.notes ? [itinerary.notes] : []),
              `预计费用：¥${itinerary.estimatedCost}`,
            ].join('\n'),
          })),
        },
      },
      include: {
        itineraries: {
          orderBy: { day: 'asc' },
        },
      },
    });

    const response = NextResponse.json(
      {
        message: 'Travel plan generated successfully',
        travelPlan,
        aiPlan: generatedPlan,
      },
      { status: 201 }
    );
    return addCorsHeaders(response, req);
  } catch (error: any) {
    console.error('AI generation error:', error);
    const response = NextResponse.json(
      {
        error: 'Failed to generate travel plan',
        details: error.message || 'Unknown error',
      },
      { status: 500 }
    );
    return addCorsHeaders(response, req);
  }
}

export const POST = withAuth(postHandler);
