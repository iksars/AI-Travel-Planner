import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/middleware/auth';
import { prisma } from '@/lib/prisma';
import { addCorsHeaders, corsMiddleware } from '@/lib/cors';

export async function OPTIONS(request: NextRequest) {
  const response = corsMiddleware(request);
  return response || new NextResponse(null, { status: 200 });
}

/**
 * GET /api/expenses?travelPlanId=xxx
 * 获取指定旅行计划的所有费用记录
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

    const { searchParams } = new URL(req.url);
    const travelPlanId = searchParams.get('travelPlanId');

    if (!travelPlanId) {
      const response = NextResponse.json(
        { error: 'Missing travelPlanId parameter' },
        { status: 400 }
      );
      return addCorsHeaders(response, req);
    }

    // 验证用户是否有权限访问该旅行计划
    const travelPlan = await prisma.travelPlan.findUnique({
      where: { id: travelPlanId },
    });

    if (!travelPlan) {
      const response = NextResponse.json(
        { error: 'Travel plan not found' },
        { status: 404 }
      );
      return addCorsHeaders(response, req);
    }

    if (travelPlan.userId !== userId) {
      const response = NextResponse.json(
        { error: 'Forbidden: You do not have access to this travel plan' },
        { status: 403 }
      );
      return addCorsHeaders(response, req);
    }

    // 获取费用记录
    const expenses = await prisma.expense.findMany({
      where: { travelPlanId },
      orderBy: { date: 'desc' },
    });

    const response = NextResponse.json({
      success: true,
      expenses,
    });
    return addCorsHeaders(response, req);
  } catch (error) {
    console.error('Get expenses error:', error);
    const response = NextResponse.json(
      { error: 'Failed to fetch expenses' },
      { status: 500 }
    );
    return addCorsHeaders(response, req);
  }
}

/**
 * POST /api/expenses
 * 创建新的费用记录
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
    const { travelPlanId, category, amount, currency = 'CNY', description, date } = body;

    // 验证必填参数
    if (!travelPlanId || !category || amount === undefined || amount === null) {
      const response = NextResponse.json(
        { error: 'Missing required fields: travelPlanId, category, amount' },
        { status: 400 }
      );
      return addCorsHeaders(response, req);
    }

    // 验证用户是否有权限访问该旅行计划
    const travelPlan = await prisma.travelPlan.findUnique({
      where: { id: travelPlanId },
    });

    if (!travelPlan) {
      const response = NextResponse.json(
        { error: 'Travel plan not found' },
        { status: 404 }
      );
      return addCorsHeaders(response, req);
    }

    if (travelPlan.userId !== userId) {
      const response = NextResponse.json(
        { error: 'Forbidden: You do not have access to this travel plan' },
        { status: 403 }
      );
      return addCorsHeaders(response, req);
    }

    // 创建费用记录
    const expense = await prisma.expense.create({
      data: {
        travelPlanId,
        category,
        amount: parseFloat(amount),
        currency,
        description,
        date: date ? new Date(date) : new Date(),
      },
    });

    const response = NextResponse.json({
      success: true,
      expense,
    }, { status: 201 });
    return addCorsHeaders(response, req);
  } catch (error) {
    console.error('Create expense error:', error);
    const response = NextResponse.json(
      { error: 'Failed to create expense' },
      { status: 500 }
    );
    return addCorsHeaders(response, req);
  }
}

export const GET = withAuth(getHandler);
export const POST = withAuth(postHandler);
