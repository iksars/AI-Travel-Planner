import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { generateToken } from '@/lib/auth';
import { corsMiddleware, addCorsHeaders } from '@/lib/cors';

export async function OPTIONS(request: NextRequest) {
  const response = corsMiddleware(request);
  return response || new NextResponse(null, { status: 200 });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // 验证必填字段
    if (!email || !password) {
      const response = NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
      return addCorsHeaders(response, request);
    }

    // 查找用户
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      const response = NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
      return addCorsHeaders(response, request);
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      const response = NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
      return addCorsHeaders(response, request);
    }

    // 生成 JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
    });

    // 返回用户信息（不包含密码）
    const { password: _, ...userWithoutPassword } = user;

    const response = NextResponse.json(
      {
        message: 'Login successful',
        user: userWithoutPassword,
        token,
      },
      { status: 200 }
    );
    return addCorsHeaders(response, request);
  } catch (error) {
    console.error('Login error:', error);
    const response = NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
    return addCorsHeaders(response, request);
  }
}
