import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { NextApiRequest, NextApiResponse } from 'next';

// 统一可用来源（App Router 与 Pages API 共用）
const allowedOrigins: string[] = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
  process.env.FRONTEND_URL || '',
].filter(Boolean);

// 允许任何 localhost/127.0.0.1 端口（开发环境更友好）
const localhostRegex = /^https?:\/\/(localhost|127\.0\.0\.1)(:\\d+)?$/i;

function isAllowedOrigin(origin?: string | null): origin is string {
  if (process.env.NODE_ENV != 'production') return true; // 测试环境下允许所有来源
  if (!origin) return false;
  if (allowedOrigins.includes(origin)) return true;
  // 在非生产环境下放宽到任意 localhost 端口
  if (process.env.NODE_ENV !== 'production' && localhostRegex.test(origin)) return true;
  return false;
}

// 统一的 CORS 头配置
const COMMON_ALLOW_METHODS = 'GET, POST, PUT, DELETE, OPTIONS';
const COMMON_ALLOW_HEADERS = 'Content-Type, Authorization, X-Requested-With, Accept';

/**
 * CORS 中间件配置
 */
export function corsMiddleware(request: NextRequest) {
  const origin = request.headers.get('origin');
  const isAllowed = isAllowedOrigin(origin);

  // 处理预检请求 (OPTIONS)
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 200 });
    if (isAllowed && origin) {
      response.headers.set('Access-Control-Allow-Origin', origin);
    }
    response.headers.set('Access-Control-Allow-Methods', COMMON_ALLOW_METHODS);
    response.headers.set('Access-Control-Allow-Headers', COMMON_ALLOW_HEADERS);
    response.headers.set('Access-Control-Max-Age', '86400');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Vary', 'Origin');
    
    return response;
  }

  return null;
}

/**
 * 为响应添加 CORS 头
 */
export function addCorsHeaders(response: NextResponse, request: NextRequest) {
  const origin = request.headers.get('origin');
  const isAllowed = isAllowedOrigin(origin);

  if (isAllowed && origin) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  }
  response.headers.set('Access-Control-Allow-Methods', COMMON_ALLOW_METHODS);
  response.headers.set('Access-Control-Allow-Headers', COMMON_ALLOW_HEADERS);
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Vary', 'Origin');

  return response;
}

/**
 * 应用 CORS 策略
 * @param req NextApiRequest
 * @param res NextApiResponse
 * @returns 如果是OPTIONS请求，则返回true，表示请求已处理完毕
 */
export function applyCors(req: NextApiRequest, res: NextApiResponse): boolean {
  const origin = (req.headers as any).origin as string | undefined;
  if (isAllowedOrigin(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin as string);
  }
  res.setHeader('Access-Control-Allow-Methods', COMMON_ALLOW_METHODS);
  res.setHeader('Access-Control-Allow-Headers', COMMON_ALLOW_HEADERS);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');
  res.setHeader('Vary', 'Origin');

  // 如果是预检请求，直接返回200
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }

  return false;
}
