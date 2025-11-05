import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/middleware/auth';
import { prisma } from '@/lib/prisma';
import { addCorsHeaders, corsMiddleware } from '@/lib/cors';

export async function OPTIONS(request: NextRequest) {
  const response = corsMiddleware(request);
  return response || new NextResponse(null, { status: 200 });
}

interface CategoryStat {
  category: string;
  totalAmount: number;
  count: number;
  percentage: number;
}

interface BudgetAnalysis {
  totalBudget: number;
  totalSpent: number;
  remaining: number;
  percentageUsed: number;
  categoryBreakdown: CategoryStat[];
  dailySpending: {
    date: string;
    amount: number;
  }[];
  recentExpenses: any[];
}

/**
 * GET /api/travel-plans/[id]/budget-analysis
 * 获取旅行计划的预算分析
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

    // 获取旅行计划
    const travelPlan = await prisma.travelPlan.findFirst({
      where: {
        id,
        userId,
      },
      include: {
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

    // 计算总花费
    const totalSpent = travelPlan.expenses.reduce(
      (sum: number, expense: any) => sum + expense.amount,
      0
    );

    // 计算剩余预算
    const remaining = travelPlan.budget - totalSpent;
    const percentageUsed = travelPlan.budget > 0
      ? (totalSpent / travelPlan.budget) * 100
      : 0;

    // 按分类统计
    const categoryMap = new Map<string, { totalAmount: number; count: number }>();
    travelPlan.expenses.forEach((expense: any) => {
      const existing = categoryMap.get(expense.category) || { totalAmount: 0, count: 0 };
      categoryMap.set(expense.category, {
        totalAmount: existing.totalAmount + expense.amount,
        count: existing.count + 1,
      });
    });

    const categoryBreakdown: CategoryStat[] = Array.from(categoryMap.entries()).map(
      ([category, data]) => ({
        category,
        totalAmount: data.totalAmount,
        count: data.count,
        percentage: totalSpent > 0 ? (data.totalAmount / totalSpent) * 100 : 0,
      })
    ).sort((a, b) => b.totalAmount - a.totalAmount);

    // 按日期统计
    const dailyMap = new Map<string, number>();
    travelPlan.expenses.forEach((expense: any) => {
      const dateStr = expense.date.toISOString().split('T')[0];
      const existing = dailyMap.get(dateStr) || 0;
      dailyMap.set(dateStr, existing + expense.amount);
    });

    const dailySpending = Array.from(dailyMap.entries())
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // 最近的费用记录（前10条）
    const recentExpenses = travelPlan.expenses.slice(0, 10);

    const analysis: BudgetAnalysis = {
      totalBudget: travelPlan.budget,
      totalSpent,
      remaining,
      percentageUsed,
      categoryBreakdown,
      dailySpending,
      recentExpenses,
    };

    const response = NextResponse.json({
      success: true,
      analysis,
    });
    return addCorsHeaders(response, req);
  } catch (error) {
    console.error('Budget analysis error:', error);
    const response = NextResponse.json(
      { error: 'Failed to analyze budget' },
      { status: 500 }
    );
    return addCorsHeaders(response, req);
  }
}

export const GET = withAuth(getHandler);
