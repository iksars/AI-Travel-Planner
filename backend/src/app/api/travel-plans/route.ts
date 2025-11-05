import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/middleware/auth';
import { corsMiddleware, addCorsHeaders } from '@/lib/cors';

export async function OPTIONS(request: NextRequest) {
  const response = corsMiddleware(request);
  return response || new NextResponse(null, { status: 200 });
}

/**
 * GET - 获取当前用户的所有旅行计划
 */
async function getHandler(req: AuthenticatedRequest) {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      const response = NextResponse.json(
        { error: 'User ID not found in token' },
        { status: 400 }
      );
      return addCorsHeaders(response, req);
    }

    // 获取查询参数
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status'); // 可选的状态筛选

    const where: any = { userId };
    if (status) {
      where.status = status;
    }

    const travelPlans = await prisma.travelPlan.findMany({
      where,
      include: {
        itineraries: {
          orderBy: { day: 'asc' },
        },
        expenses: true,
        _count: {
          select: {
            itineraries: true,
            expenses: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const response = NextResponse.json({ travelPlans }, { status: 200 });
    return addCorsHeaders(response, req);
  } catch (error) {
    console.error('Get travel plans error:', error);
    const response = NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
    return addCorsHeaders(response, req);
  }
}

/**
 * POST - 创建新的旅行计划
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
      title,
      destination,
      startDate,
      endDate,
      budget,
      peopleCount,
      preferences,
      aiGenerated = false,
    } = body;

    // 验证必填字段
    if (!title || !destination || !startDate || !endDate || !budget || !peopleCount) {
      const response = NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
      return addCorsHeaders(response, req);
    }

    // 验证日期
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start >= end) {
      const response = NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      );
      return addCorsHeaders(response, req);
    }

    // 创建旅行计划
    const travelPlan = await prisma.travelPlan.create({
      data: {
        userId,
        title,
        destination,
        startDate: start,
        endDate: end,
        budget: parseFloat(budget),
        peopleCount: parseInt(peopleCount),
        preferences: preferences ? JSON.stringify(preferences) : null,
        aiGenerated,
        status: 'draft',
      },
      include: {
        itineraries: true,
        expenses: true,
      },
    });

    const response = NextResponse.json(
      {
        message: 'Travel plan created successfully',
        travelPlan,
      },
      { status: 201 }
    );
    return addCorsHeaders(response, req);
  } catch (error) {
    console.error('Create travel plan error:', error);
    const response = NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
    return addCorsHeaders(response, req);
  }
}

export const GET = withAuth(getHandler);
export const POST = withAuth(postHandler);
