import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/middleware/auth';
import { corsMiddleware, addCorsHeaders } from '@/lib/cors';

export async function OPTIONS(request: NextRequest) {
  const response = corsMiddleware(request);
  return response || new NextResponse(null, { status: 200 });
}

/**
 * GET - 获取单个旅行计划的详细信息
 */
async function getHandler(
  req: AuthenticatedRequest,
  context?: { params: Promise<{ id: string }> }
) {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      const response = NextResponse.json(
        { error: 'User ID not found in token' },
        { status: 400 }
      );
      return addCorsHeaders(response, req);
    }

    if (!context?.params) {
      const response = NextResponse.json(
        { error: 'Invalid request - missing params' },
        { status: 400 }
      );
      return addCorsHeaders(response, req);
    }

    const { id } = await context.params;

    const travelPlan = await prisma.travelPlan.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        itineraries: {
          orderBy: { day: 'asc' },
        },
        expenses: {
          orderBy: { date: 'desc' },
        },
      },
    });

    if (!travelPlan) {
      const response = NextResponse.json(
        { error: 'Travel plan not found' },
        { status: 404 }
      );
      return addCorsHeaders(response, req);
    }

    const response = NextResponse.json({ travelPlan }, { status: 200 });
    return addCorsHeaders(response, req);
  } catch (error) {
    console.error('Get travel plan error:', error);
    const response = NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
    return addCorsHeaders(response, req);
  }
}

/**
 * PUT - 更新旅行计划
 */
async function putHandler(
  req: AuthenticatedRequest,
  context?: { params: Promise<{ id: string }> }
) {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      const response = NextResponse.json(
        { error: 'User ID not found in token' },
        { status: 400 }
      );
      return addCorsHeaders(response, req);
    }

    if (!context?.params) {
      const response = NextResponse.json(
        { error: 'Invalid request - missing params' },
        { status: 400 }
      );
      return addCorsHeaders(response, req);
    }

    const { id } = await context.params;

    // 验证旅行计划是否存在且属于当前用户
    const existingPlan = await prisma.travelPlan.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingPlan) {
      const response = NextResponse.json(
        { error: 'Travel plan not found' },
        { status: 404 }
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
      status,
    } = body;

    // 构建更新数据对象
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (destination !== undefined) updateData.destination = destination;
    if (startDate !== undefined) updateData.startDate = new Date(startDate);
    if (endDate !== undefined) updateData.endDate = new Date(endDate);
    if (budget !== undefined) updateData.budget = parseFloat(budget);
    if (peopleCount !== undefined) updateData.peopleCount = parseInt(peopleCount);
    if (preferences !== undefined) updateData.preferences = JSON.stringify(preferences);
    if (status !== undefined) updateData.status = status;

    // 更新旅行计划
    const travelPlan = await prisma.travelPlan.update({
      where: { id },
      data: updateData,
      include: {
        itineraries: {
          orderBy: { day: 'asc' },
        },
        expenses: true,
      },
    });

    const response = NextResponse.json(
      {
        message: 'Travel plan updated successfully',
        travelPlan,
      },
      { status: 200 }
    );
    return addCorsHeaders(response, req);
  } catch (error) {
    console.error('Update travel plan error:', error);
    const response = NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
    return addCorsHeaders(response, req);
  }
}

/**
 * DELETE - 删除旅行计划
 */
async function deleteHandler(
  req: AuthenticatedRequest,
  context?: { params: Promise<{ id: string }> }
) {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      const response = NextResponse.json(
        { error: 'User ID not found in token' },
        { status: 400 }
      );
      return addCorsHeaders(response, req);
    }

    if (!context?.params) {
      const response = NextResponse.json(
        { error: 'Invalid request - missing params' },
        { status: 400 }
      );
      return addCorsHeaders(response, req);
    }

    const { id } = await context.params;

    // 验证旅行计划是否存在且属于当前用户
    const existingPlan = await prisma.travelPlan.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingPlan) {
      const response = NextResponse.json(
        { error: 'Travel plan not found' },
        { status: 404 }
      );
      return addCorsHeaders(response, req);
    }

    // 删除旅行计划（关联的 itineraries 和 expenses 会自动级联删除）
    await prisma.travelPlan.delete({
      where: { id },
    });

    const response = NextResponse.json(
      { message: 'Travel plan deleted successfully' },
      { status: 200 }
    );
    return addCorsHeaders(response, req);
  } catch (error) {
    console.error('Delete travel plan error:', error);
    const response = NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
    return addCorsHeaders(response, req);
  }
}

export const GET = withAuth(getHandler);
export const PUT = withAuth(putHandler);
export const DELETE = withAuth(deleteHandler);
