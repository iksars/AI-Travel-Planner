import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/middleware/auth';
import { prisma } from '@/lib/prisma';
import { addCorsHeaders, corsMiddleware } from '@/lib/cors';

export async function OPTIONS(request: NextRequest) {
  const response = corsMiddleware(request);
  return response || new NextResponse(null, { status: 200 });
}

/**
 * GET /api/expenses/[id]
 * 获取单个费用记录
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

    // 获取费用记录
    const expense = await prisma.expense.findUnique({
      where: { id },
      include: {
        travelPlan: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!expense) {
      const response = NextResponse.json(
        { error: 'Expense not found' },
        { status: 404 }
      );
      return addCorsHeaders(response, req);
    }

    // 验证权限
    if (expense.travelPlan.userId !== userId) {
      const response = NextResponse.json(
        { error: 'Forbidden: You do not have access to this expense' },
        { status: 403 }
      );
      return addCorsHeaders(response, req);
    }

    const response = NextResponse.json({
      success: true,
      expense,
    });
    return addCorsHeaders(response, req);
  } catch (error) {
    console.error('Get expense error:', error);
    const response = NextResponse.json(
      { error: 'Failed to fetch expense' },
      { status: 500 }
    );
    return addCorsHeaders(response, req);
  }
}

/**
 * PUT /api/expenses/[id]
 * 更新费用记录
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
    const body = await req.json();
    const { category, amount, currency, description, date } = body;

    // 验证权限
    const existingExpense = await prisma.expense.findUnique({
      where: { id },
      include: {
        travelPlan: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!existingExpense) {
      const response = NextResponse.json(
        { error: 'Expense not found' },
        { status: 404 }
      );
      return addCorsHeaders(response, req);
    }

    if (existingExpense.travelPlan.userId !== userId) {
      const response = NextResponse.json(
        { error: 'Forbidden: You do not have access to this expense' },
        { status: 403 }
      );
      return addCorsHeaders(response, req);
    }

    // 更新费用记录
    const updateData: any = {};
    if (category !== undefined) updateData.category = category;
    if (amount !== undefined) updateData.amount = parseFloat(amount);
    if (currency !== undefined) updateData.currency = currency;
    if (description !== undefined) updateData.description = description;
    if (date !== undefined) updateData.date = new Date(date);

    const expense = await prisma.expense.update({
      where: { id },
      data: updateData,
    });

    const response = NextResponse.json({
      success: true,
      expense,
    });
    return addCorsHeaders(response, req);
  } catch (error) {
    console.error('Update expense error:', error);
    const response = NextResponse.json(
      { error: 'Failed to update expense' },
      { status: 500 }
    );
    return addCorsHeaders(response, req);
  }
}

/**
 * DELETE /api/expenses/[id]
 * 删除费用记录
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

    // 验证权限
    const expense = await prisma.expense.findUnique({
      where: { id },
      include: {
        travelPlan: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!expense) {
      const response = NextResponse.json(
        { error: 'Expense not found' },
        { status: 404 }
      );
      return addCorsHeaders(response, req);
    }

    if (expense.travelPlan.userId !== userId) {
      const response = NextResponse.json(
        { error: 'Forbidden: You do not have access to this expense' },
        { status: 403 }
      );
      return addCorsHeaders(response, req);
    }

    // 删除费用记录
    await prisma.expense.delete({
      where: { id },
    });

    const response = NextResponse.json({
      success: true,
      message: 'Expense deleted successfully',
    });
    return addCorsHeaders(response, req);
  } catch (error) {
    console.error('Delete expense error:', error);
    const response = NextResponse.json(
      { error: 'Failed to delete expense' },
      { status: 500 }
    );
    return addCorsHeaders(response, req);
  }
}

export const GET = withAuth(getHandler);
export const PUT = withAuth(putHandler);
export const DELETE = withAuth(deleteHandler);
