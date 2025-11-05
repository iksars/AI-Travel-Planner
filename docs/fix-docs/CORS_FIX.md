# CORS 问题解决方案

## 问题描述
前端（localhost:5173）和后端（localhost:3000）在不同端口运行时，浏览器会阻止跨域请求（CORS错误）。

## 解决方案

### 1. 创建了 CORS 中间件
**文件**: `backend/src/lib/cors.ts`

这个文件包含两个主要函数：
- `corsMiddleware()` - 处理 OPTIONS 预检请求
- `addCorsHeaders()` - 为响应添加 CORS 头

允许的源：
- http://localhost:5173 (前端开发服务器)
- http://localhost:3000 (后端服务器)
- http://127.0.0.1:5173
- http://127.0.0.1:3000

### 2. 更新了所有 API 路由

每个 API 路由现在都：
1. 导出 `OPTIONS` 处理器来处理预检请求
2. 使用 `addCorsHeaders()` 为所有响应添加 CORS 头

更新的文件：
- ✅ `backend/src/app/api/auth/register/route.ts`
- ✅ `backend/src/app/api/auth/login/route.ts`
- ✅ `backend/src/app/api/auth/me/route.ts`
- ✅ `backend/src/app/api/travel-plans/route.ts`
- ✅ `backend/src/app/api/travel-plans/[id]/route.ts`

### 3. CORS 配置详情

**允许的 HTTP 方法**:
- GET
- POST
- PUT
- DELETE
- OPTIONS

**允许的请求头**:
- Content-Type
- Authorization

**其他设置**:
- `Access-Control-Allow-Credentials`: true (允许发送 cookies)
- `Access-Control-Max-Age`: 86400 (预检请求缓存 24 小时)

## 测试步骤

1. 确保后端服务器正在运行:
   ```bash
   cd backend
   npm run dev
   # 应该运行在 http://localhost:3000
   ```

2. 确保前端服务器正在运行:
   ```bash
   cd frontend
   npm run dev
   # 应该运行在 http://localhost:5173
   ```

3. 在浏览器中访问 http://localhost:5173

4. 尝试注册/登录，CORS 错误应该已经解决

## 常见问题

### Q: 为什么还是有 CORS 错误？
A: 
- 确保后端服务器已重启
- 检查浏览器控制台的具体错误信息
- 确认前端请求的 URL 正确（应该是 http://localhost:3000/api/...）

### Q: 生产环境怎么配置？
A: 
在生产环境中，你需要：
1. 修改 `backend/src/lib/cors.ts` 中的 `allowedOrigins` 数组
2. 添加你的生产域名（例如：https://your-domain.com）
3. 移除开发环境的 localhost 地址

示例：
```typescript
const allowedOrigins = [
  'https://your-domain.com',
  'https://www.your-domain.com',
];
```

## 代码示例

### API 路由模板（带 CORS）
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { corsMiddleware, addCorsHeaders } from '@/lib/cors';

// 处理 OPTIONS 预检请求
export async function OPTIONS(request: NextRequest) {
  const response = corsMiddleware(request);
  return response || new NextResponse(null, { status: 200 });
}

// 实际的请求处理器
export async function POST(request: NextRequest) {
  try {
    // 你的逻辑...
    const response = NextResponse.json({ data: 'success' });
    return addCorsHeaders(response, request);
  } catch (error) {
    const response = NextResponse.json({ error: 'error' }, { status: 500 });
    return addCorsHeaders(response, request);
  }
}
```

## 验证

打开浏览器开发者工具（F12）-> Network 标签页，你应该看到：

1. **OPTIONS 请求**（预检）:
   - Status: 200
   - Response Headers 包含:
     - Access-Control-Allow-Origin: http://localhost:5173
     - Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
     - Access-Control-Allow-Headers: Content-Type, Authorization

2. **实际请求**（POST/GET 等）:
   - Status: 200 或其他
   - Response Headers 包含:
     - Access-Control-Allow-Origin: http://localhost:5173

如果看到这些头部，说明 CORS 配置成功！
