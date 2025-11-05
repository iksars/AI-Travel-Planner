# AI 生成问题故障排查指南

## 问题：AI 生成失败 "Invalid plan structure"

### 可能原因

1. **AI 返回的 JSON 格式不正确**
   - OpenAI 可能返回了不完整的 JSON
   - 响应被截断
   - 包含了额外的文本

2. **缺少必需字段**
   - 没有 `title` 字段
   - 没有 `itineraries` 数组
   - `itineraries` 为空

3. **Token 限制**
   - 响应过长被截断
   - max_tokens 设置过小

## 最新修复（2025-11-04）

### 改进内容

#### 1. 增强调试信息
```typescript
// 打印 AI 响应的前 500 字符
console.log('AI Response:', content.substring(0, 500));

// 详细的验证日志
console.log('Validating plan structure...', {
  hasTitle: !!plan.title,
  hasItineraries: !!plan.itineraries,
  itinerariesLength: plan.itineraries?.length || 0,
  expectedDays: input.days
});
```

#### 2. 优化 System Prompt
```typescript
// 更明确的指令
重要规则：
1. 必须返回有效的 JSON 格式，不要添加任何其他文本或解释
2. JSON 必须包含以下顶层字段：title, destination, totalDays, totalBudget, itineraries, tips
3. itineraries 必须是数组，长度等于旅行天数
4. 所有数字字段都是数字类型，不要用字符串
5. 确保返回的是完整的 JSON 对象，不要截断
```

#### 3. 简化用户 Prompt
- 移除过多的格式说明
- 提供具体的示例值
- 明确数据类型要求

#### 4. 增加容错处理
```typescript
// 如果缺少字段，自动填充默认值
if (!generatedPlan.title) {
  generatedPlan.title = `${input.destination}${input.days}日游`;
}
if (!generatedPlan.tips) {
  generatedPlan.tips = [];
}
```

#### 5. 增加 Token 限制
```typescript
max_tokens: 4000  // 确保生成完整响应
```

## 如何调试

### 1. 查看后端日志

运行后端服务时查看控制台输出：

```bash
cd backend
npm run dev
```

**关键日志**：
```
AI Response: {"title":"北京3日游"...  # AI 返回的 JSON
Validating plan structure... { ... }   # 验证信息
```

### 2. 检查 AI 响应

如果看到 JSON Parse Error：
```
JSON Parse Error: SyntaxError: Unexpected token...
Raw content: ...  # 查看原始内容
```

**可能的问题**：
- JSON 格式错误（缺少引号、逗号等）
- 包含额外文本
- 响应被截断

### 3. 验证字段

如果看到 Invalid plan structure：
```javascript
{
  hasTitle: false,          // ❌ 缺少 title
  hasItineraries: false,    // ❌ 缺少 itineraries
  itinerariesLength: 0,     // ❌ 数组为空
  expectedDays: 3
}
```

### 4. 检查完整响应

在 `ai.ts` 中临时添加：
```typescript
console.log('Full AI Response:', JSON.stringify(generatedPlan, null, 2));
```

## 临时解决方案

### 方案 1: 降低复杂度

减少生成天数和内容：
```javascript
{
  days: 1,  // 从 3 天改为 1 天
  budget: 1000
}
```

### 方案 2: 使用更强大的模型

在 `.env` 中修改：
```bash
# 从 gpt-4o-mini 改为 gpt-4o
OPENAI_MODEL="gpt-4o"
```

**注意**：费用会增加 10-20 倍

### 方案 3: 增加重试机制

在前端添加重试逻辑：
```typescript
async function generateWithRetry(data: any, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await generateItinerary(data);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 2000)); // 等待 2 秒
    }
  }
}
```

## 测试步骤

### 1. 最小测试

使用最简单的参数测试：
```json
{
  "destination": "北京",
  "days": 1,
  "budget": 1000,
  "peopleCount": 2,
  "startDate": "2025-11-10",
  "preferences": ["美食"]
}
```

### 2. 逐步增加复杂度

如果 1 天成功，尝试：
- 2 天
- 3 天
- 添加更多偏好

### 3. 查看完整日志

```bash
# 后端日志
cd backend
npm run dev | tee backend.log

# 前端日志
打开浏览器控制台
```

## 常见错误模式

### 错误 1: JSON 解析失败
```
JSON Parse Error: Unexpected token < in JSON at position 0
```

**原因**: AI 返回了 HTML 或文本而不是 JSON

**解决**: 
- 检查 OPENAI_API_KEY 是否正确
- 检查网络连接
- 查看 baseURL 配置

### 错误 2: 字段缺失
```
Invalid plan structure: missing title or itineraries
```

**原因**: AI 返回的 JSON 结构不完整

**解决**:
- 已添加容错处理（自动填充）
- 如果仍失败，查看完整响应

### 错误 3: 响应截断
```
AI Response: {"title":"北京3日游","destination":"北京","totalDays":3,"...
```

**原因**: max_tokens 太小

**解决**:
- 已增加到 4000
- 如需更多，可调整到 8000

### 错误 4: 超时
```
Error: Request timeout
```

**原因**: OpenAI API 响应慢

**解决**:
- 等待重试
- 检查网络
- 考虑使用代理（国内）

## 配置检查

### 1. 环境变量

检查 `backend/.env`：
```bash
# 必需
OPENAI_API_KEY="sk-..."  # 必须以 sk- 开头

# 可选
OPENAI_MODEL="gpt-4o-mini"  # 默认模型
AI_API_URL="https://api.openai.com/v1"  # 可选代理
```

### 2. API Key 验证

测试 API Key 是否有效：
```bash
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### 3. 余额检查

访问 https://platform.openai.com/usage
- 检查是否有余额
- 查看 API 限额

## 高级调试

### 直接测试 AI 函数

创建测试文件 `test-ai.ts`：
```typescript
import { generateTravelItinerary } from './src/lib/ai';

async function test() {
  try {
    const result = await generateTravelItinerary({
      destination: '北京',
      days: 1,
      budget: 1000,
      peopleCount: 2,
      startDate: '2025-11-10',
      preferences: ['美食']
    });
    console.log('Success:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

test();
```

运行：
```bash
npx tsx test-ai.ts
```

### 使用 OpenAI Playground

1. 访问 https://platform.openai.com/playground
2. 复制 System Prompt
3. 复制 User Prompt
4. 手动测试生成

## 性能优化

### 减少响应时间

1. **使用更快的模型**
   ```bash
   OPENAI_MODEL="gpt-4o-mini"  # 最快
   ```

2. **减少 max_tokens**
   ```typescript
   max_tokens: 2000  // 对于简单行程
   ```

3. **降低 temperature**
   ```typescript
   temperature: 0.5  // 更确定性，更快
   ```

### 减少 Token 消耗

1. **简化 Prompt**
   - 移除冗余说明
   - 只保留关键要求

2. **使用更短的示例**
   - 减少 JSON 示例的详细程度

3. **按需生成坐标**
   - 只为重要景点生成坐标
   - 其他使用地理编码

## 成功标准

### 生成成功的标志

```
✅ AI Response: {"title":"北京3日游"...
✅ Validating plan structure... { hasTitle: true, hasItineraries: true, itinerariesLength: 3 }
✅ POST /api/ai/generate-itinerary 201 in 15.0s
```

### 数据验证

生成的计划应包含：
```javascript
{
  title: "北京3日游",
  destination: "北京",
  totalDays: 3,
  totalBudget: 5000,
  itineraries: [
    {
      day: 1,
      date: "2025-11-10",
      title: "...",
      activities: [...],  // 至少 2 个
      // ...
    }
    // ... 共 3 个
  ],
  tips: [...],
  warnings: [...]
}
```

## 获取帮助

如果问题仍未解决：

1. **收集信息**
   - 完整的错误日志
   - 请求参数
   - AI 响应内容（前 1000 字符）
   - 环境配置

2. **检查文档**
   - [AI 功能指南](./docs/AI_FEATURE_GUIDE.md)
   - [配置说明](./CONFIGURATION.md)

3. **提交 Issue**
   - 包含上述所有信息
   - 说明复现步骤

## 参考资源

- [OpenAI API 文档](https://platform.openai.com/docs)
- [JSON Mode 说明](https://platform.openai.com/docs/guides/json-mode)
- [错误代码参考](https://platform.openai.com/docs/guides/error-codes)
