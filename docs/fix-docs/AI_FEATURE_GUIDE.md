# AI 智能行程规划功能 - 使用指南

## 🎉 Phase 2 完成！

我们已成功实现了 AI 智能行程规划功能，这是本项目最核心的创新特性。

## ✨ 功能亮点

### 后端实现

1. **AI 服务层** (`backend/src/lib/ai.ts`)
   - ✅ 集成 OpenAI API
   - ✅ 支持其他兼容 OpenAI 的服务（通义千问、Deepseek等）
   - ✅ 智能 Prompt 工程
   - ✅ 结构化数据输出（JSON格式）
   - ✅ 完善的错误处理

2. **AI API 路由** (`/api/ai/generate-itinerary`)
   - ✅ POST 接口接收用户需求
   - ✅ 调用 AI 生成行程
   - ✅ 自动保存到数据库
   - ✅ CORS 支持
   - ✅ JWT 认证保护

3. **AI 生成内容**
   - 每日详细行程安排
   - 景点推荐（含时间、地点、描述）
   - 交通方式建议
   - 住宿推荐（含价格估算）
   - 餐厅推荐（含菜系、招牌菜）
   - 预算分配
   - 旅行建议和注意事项

### 前端实现

1. **AI 生成页面** (`/ai-generator`)
   - ✅ 精美的渐变背景设计
   - ✅ 直观的表单输入
   - ✅ 多种旅行偏好选择
   - ✅ 实时生成进度显示
   - ✅ 动画加载效果

2. **行程展示优化**
   - ✅ 时间线式布局
   - ✅ 每日活动详细展示
   - ✅ 交通、住宿、餐饮信息分块显示
   - ✅ 响应式设计

3. **用户体验**
   - ✅ 从旅行计划列表快速进入 AI 生成
   - ✅ 生成完成自动跳转到详情页
   - ✅ 支持手动创建和 AI 创建两种方式

## 🚀 如何使用

### 1. 配置 OpenAI API Key

编辑 `backend/.env` 文件：

```env
OPENAI_API_KEY="sk-your-actual-api-key-here"
OPENAI_MODEL="gpt-4o-mini"
```

**获取 API Key 方式：**

#### 选项 A: OpenAI 官方
1. 访问 https://platform.openai.com/api-keys
2. 注册/登录账号
3. 创建新的 API Key
4. 复制粘贴到 .env 文件

#### 选项 B: 国内兼容服务
如果使用通义千问、Deepseek 等国内服务：

```env
OPENAI_API_KEY="your-compatible-api-key"
OPENAI_MODEL="qwen-turbo"  # 或其他模型名称
AI_API_URL="https://dashscope.aliyuncs.com/compatible-mode/v1"  # 通义千问示例
```

需要在 `backend/src/lib/ai.ts` 中取消注释 baseURL 配置：
```typescript
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
  baseURL: process.env.AI_API_URL,  // 取消这行的注释
});
```

### 2. 启动服务

#### 后端
```bash
cd backend
npm run dev
# 运行在 http://localhost:3000
```

#### 前端
```bash
cd frontend
npm run dev
# 运行在 http://localhost:5173
```

### 3. 使用 AI 生成旅行计划

1. 登录系统
2. 在旅行计划列表页点击 **"AI 智能规划"** 按钮
3. 填写旅行需求：
   - 📍 目的地（例如：日本东京）
   - 📅 出发日期
   - ⏱️ 旅行天数（1-30天）
   - 💰 总预算
   - 👥 人数
   - 🎯 旅行偏好（可多选）
   - 📝 其他特殊要求
4. 点击 **"生成我的专属旅行计划"**
5. 等待 AI 生成（通常 10-30 秒）
6. 自动跳转到生成的行程详情页

## 📋 API 文档

### POST /api/ai/generate-itinerary

**需要认证**: 是（JWT Token）

**请求体**:
```json
{
  "destination": "日本东京",
  "days": 5,
  "budget": 10000,
  "peopleCount": 2,
  "startDate": "2025-12-01",
  "preferences": ["美食探索", "历史文化", "购物休闲"],
  "otherRequirements": "想住温泉酒店"
}
```

**响应**:
```json
{
  "message": "Travel plan generated successfully",
  "travelPlan": {
    "id": "uuid",
    "title": "东京5日深度游",
    "destination": "日本东京",
    ...
  },
  "aiPlan": {
    "title": "东京5日深度游",
    "totalDays": 5,
    "totalBudget": 10000,
    "itineraries": [...],
    "tips": ["建议提前购买西瓜卡", ...],
    "warnings": ["注意电车末班车时间", ...]
  }
}
```

## 🎯 AI Prompt 设计

我们的 Prompt 工程包含：

1. **系统角色定义**
   - 专业旅行规划师身份
   - 明确输出要求（JSON格式）
   - 质量标准说明

2. **用户需求解析**
   - 目的地、日期、预算、人数
   - 旅行偏好和特殊要求
   - 上下文丰富的描述

3. **结构化输出模板**
   - 详细的 JSON Schema
   - 字段说明和示例
   - 数据验证规则

4. **质量保证**
   - 预算合理性验证
   - 行程天数匹配检查
   - 必要字段完整性验证

## 🔧 自定义和扩展

### 修改 AI 模型

在 `.env` 文件中更改：
```env
# GPT-4 (更好的质量，更高的成本)
OPENAI_MODEL="gpt-4"

# GPT-3.5 Turbo (更快，成本更低)
OPENAI_MODEL="gpt-3.5-turbo"

# GPT-4o-mini (推荐，性价比高)
OPENAI_MODEL="gpt-4o-mini"
```

### 优化 Prompt

编辑 `backend/src/lib/ai.ts` 中的 `buildPrompt()` 函数：
- 添加更多上下文信息
- 调整输出格式要求
- 增加特定领域知识

### 扩展功能

可以继续实现：
- 多语言支持
- 语音输入集成
- 实时行程调整
- 协作编辑
- 行程分享

## 💡 最佳实践

1. **预算设置**
   - 人均预算建议：国内游 1000-5000元/天，出境游 2000-10000元/天
   - 总预算 = 人均预算 × 天数 × 人数

2. **目的地描述**
   - 越具体越好（例如：东京涩谷区 > 日本东京 > 日本）
   - 可以包含多个城市（例如：东京-京都-大阪）

3. **偏好选择**
   - 最多选择 3-4 个偏好，确保行程聚焦
   - 矛盾的偏好可能导致行程不协调

4. **其他要求**
   - 具体说明特殊需求
   - 例如：带小孩、行动不便、饮食限制等

## 🐛 故障排查

### AI 返回错误

1. **检查 API Key**
   ```bash
   # 测试连接
   curl https://api.openai.com/v1/models \
     -H "Authorization: Bearer $OPENAI_API_KEY"
   ```

2. **查看后端日志**
   ```bash
   # 后端终端会显示详细错误信息
   ```

3. **余额不足**
   - 检查 OpenAI 账户余额
   - 考虑切换到免费的兼容服务

### 生成内容质量差

1. **优化输入**
   - 提供更详细的需求描述
   - 选择合适的偏好标签

2. **调整模型**
   - 切换到 GPT-4 获得更好质量
   - 修改 temperature 参数（在 ai.ts 中）

3. **改进 Prompt**
   - 添加更多示例
   - 细化输出要求

## 📊 成本估算

使用 GPT-4o-mini（推荐）：
- 输入：约 500-1000 tokens
- 输出：约 2000-4000 tokens
- 成本：约 $0.002-0.005 / 次生成
- 100 次生成 ≈ $0.2-0.5

使用 GPT-4：
- 成本约为 GPT-4o-mini 的 20-30 倍
- 质量提升显著，适合高端用户

## 🎓 技术详解

### Prompt Engineering 关键点

1. **明确角色**：让 AI 扮演专业旅行规划师
2. **结构化输出**：使用 `response_format: { type: 'json_object' }`
3. **示例驱动**：提供详细的 JSON 模板
4. **上下文丰富**：包含所有相关信息
5. **质量控制**：后端验证和调整

### 为什么选择 OpenAI

- ✅ 最先进的语言理解能力
- ✅ 优秀的中文支持
- ✅ 稳定的 API 服务
- ✅ 丰富的生态系统
- ✅ 灵活的定价模型

### 数据流程

```
用户输入 → 前端表单 
       ↓
   API 请求（含 JWT）
       ↓
   后端验证 → 构建 Prompt
       ↓
   OpenAI API → AI 生成
       ↓
   JSON 解析 → 数据验证
       ↓
   保存数据库 → 返回结果
       ↓
   前端展示
```

## 🚀 下一步

Phase 2 已完成核心 AI 功能，接下来可以：

1. **地图集成**（Phase 2 续）
   - 在详情页显示地图
   - 标记景点和路线
   - 导航功能

2. **预算与记账**（Phase 3）
   - 预算详细分解
   - 实时费用记录
   - 图表可视化

3. **语音输入**（Phase 4）
   - 集成语音识别 API
   - 语音记账
   - 语音查询

## 📝 总结

Phase 2 的 AI 集成为我们的应用带来了革命性的用户体验：
- ✅ 从繁琐的手动规划到秒级智能生成
- ✅ 个性化推荐，完全贴合用户需求
- ✅ 专业级行程安排，媲美人工规划师
- ✅ 为用户节省大量时间和精力

这是一个真正的 AI 原生应用！🎉
