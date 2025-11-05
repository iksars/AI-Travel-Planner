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
    const { email, password, name } = body;

    // 验证必填字段
    if (!email || !password) {
      const response = NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
      return addCorsHeaders(response, request);
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      const response = NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
      return addCorsHeaders(response, request);
    }

    // 验证密码长度
    if (password.length < 6) {
      const response = NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
      return addCorsHeaders(response, request);
    }

    // 检查用户是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      const response = NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
      return addCorsHeaders(response, request);
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建用户
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        createdAt: true,
      },
    });

    // 生成 JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
    });

    const response = NextResponse.json(
      {
        message: 'User registered successfully',
        user,
        token,
      },
      { status: 201 }
    );
    return addCorsHeaders(response, request);
  } catch (error) {
    console.error('Registration error:', error);
    const response = NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
    return addCorsHeaders(response, request);
  }
}
