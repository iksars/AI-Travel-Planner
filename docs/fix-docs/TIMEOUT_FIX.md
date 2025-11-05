# AI 生成超时问题修复指南

## 问题描述

用户反馈：
```
POST /api/ai/generate-itinerary 200 in 15.0s
```

接口返回了 200，但 AI 还没有完成生成。

## 根本原因

1. **智谱 AI 生成时间较长**: 3-7 天行程需要 15-30 秒
2. **默认超时太短**: 前端 15s，后端 10-15s
3. **没有进度反馈**: 用户不知道生成还在进行

## 已实施的修复（2025-11-04）

### 1. 后端超时配置 ✅

`backend/src/app/api/ai/generate-itinerary/route.ts`:
```typescript
export const maxDuration = 60 * 10; // 10 分钟
export const dynamic = 'force-dynamic';
```

### 2. 前端超时配置 ✅

`frontend/src/api/client.ts`:
```typescript
timeout: 30000, // 默认 30s
```

`frontend/src/api/ai.ts`:
```typescript
timeout: 60000 * 10, // AI 生成 10 分钟
```

### 3. 超时错误提示 ✅

```typescript
if (error.code === 'ECONNABORTED') {
  ElMessage.error('请求超时，AI 生成需要较长时间，请稍后重试');
}
```

### 4. 生成时间监控 ✅

```typescript
console.log(`Starting AI generation for ${destination}, ${days} days...`);
console.log(`AI generation completed in ${elapsedTime}s`);
```

## 超时配置总结

| 组件 | 原值 | 新值 |
|-----|------|------|
| Axios 默认 | 15s | 30s |
| AI 生成请求 | 15s | 60s |
| Next.js 路由 | ~10s | 60s |

## 测试方法

1. 启动服务
2. 生成 2-3 天行程
3. 查看后端日志：
   ```
   Starting AI generation for 杭州, 2 days...
   AI generation completed in 8.3s
   ✅ POST /api/ai/generate-itinerary 201
   ```

## 性能基准

| 天数 | 预计时间 |
|-----|---------|
| 1-2天 | 6-10s |
| 3-4天 | 12-20s |
| 5-7天 | 25-40s |

## 如果仍超时

1. 减少天数测试（如 2 天）
2. 检查模型配置（推荐 glm-4-flash）
3. 查看后端完整日志
4. 参考 [智谱 AI 配置指南](./ZHIPU_AI_SETUP.md)

## 相关文档

- [智谱 AI 配置](./ZHIPU_AI_SETUP.md)
- [故障排查](./AI_GENERATION_TROUBLESHOOTING.md)
