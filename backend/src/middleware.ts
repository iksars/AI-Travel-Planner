
import { NextRequest, NextResponse } from 'next/server';
import { corsMiddleware, addCorsHeaders } from './lib/cors';

export function middleware(request: NextRequest) {
  // Handle CORS preflight requests
  const corsResponse = corsMiddleware(request);
  if (corsResponse) {
    return corsResponse;
  }

  // For other requests, add CORS headers to the response
  const response = NextResponse.next();
  return addCorsHeaders(response, request);
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: '/api/:path*',
};
