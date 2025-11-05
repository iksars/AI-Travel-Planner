# Phase 3: 预算与记账功能使用指南

## 功能概述

Phase 3 实现了完整的预算管理和费用记录功能，包括：
- AI 智能预算估算
- 费用记录的增删改查
- 预算使用分析
- 可视化图表展示

## 后端 API

### 1. AI 预算估算

**接口**: `POST /api/ai/estimate-budget`

**请求示例**:
```json
{
  "destination": "北京",
  "days": 3,
  "peopleCount": 2,
  "preferences": ["美食", "文化"],
  "travelStyle": "moderate"  // budget | moderate | luxury
}
```

**响应示例**:
```json
{
  "success": true,
  "estimate": {
    "totalEstimate": 3000,
    "perPersonEstimate": 1500,
    "breakdown": [
      {
        "category": "交通",
        "estimatedAmount": 800,
        "percentage": 26.67,
        "description": "包括往返机票/火车票、当地交通等"
      },
      {
        "category": "住宿",
        "estimatedAmount": 900,
        "percentage": 30,
        "description": "酒店或民宿住宿费用"
      }
    ],
    "tips": ["建议提前预订酒店可节省20%"],
    "savingTips": ["使用公共交通可节省交通费用"]
  }
}
```

### 2. 费用记录 CRUD

#### 获取费用列表
**接口**: `GET /api/expenses?travelPlanId=xxx`

**响应示例**:
```json
{
  "success": true,
  "expenses": [
    {
      "id": "expense-id",
      "travelPlanId": "plan-id",
      "category": "交通",
      "amount": 100,
      "currency": "CNY",
      "description": "打车费用",
      "date": "2025-11-05T10:00:00.000Z",
      "createdAt": "2025-11-05T10:00:00.000Z"
    }
  ]
}
```

#### 创建费用记录
**接口**: `POST /api/expenses`

**请求示例**:
```json
{
  "travelPlanId": "plan-id",
  "category": "餐饮",
  "amount": 150,
  "currency": "CNY",
  "description": "午餐",
  "date": "2025-11-05"
}
```

#### 更新费用记录
**接口**: `PUT /api/expenses/:id`

**请求示例**:
```json
{
  "category": "餐饮",
  "amount": 180,
  "description": "午餐（已更新）"
}
```

#### 删除费用记录
**接口**: `DELETE /api/expenses/:id`

### 3. 预算分析

**接口**: `GET /api/travel-plans/:id/budget-analysis`

**响应示例**:
```json
{
  "success": true,
  "analysis": {
    "totalBudget": 5000,
    "totalSpent": 3200,
    "remaining": 1800,
    "percentageUsed": 64,
    "categoryBreakdown": [
      {
        "category": "交通",
        "totalAmount": 1200,
        "count": 5,
        "percentage": 37.5
      },
      {
        "category": "餐饮",
        "totalAmount": 1000,
        "count": 8,
        "percentage": 31.25
      }
    ],
    "dailySpending": [
      {
        "date": "2025-11-05",
        "amount": 800
      },
      {
        "date": "2025-11-06",
        "amount": 1200
      }
    ],
    "recentExpenses": [...]
  }
}
```

## 前端组件

### BudgetAnalysis 组件

**位置**: `frontend/src/components/BudgetAnalysis.vue`

**功能特性**:

1. **预算概览卡片**
   - 显示总预算、已花费、剩余、使用比例
   - 实时更新数据
   - 颜色提示（超支显示警告色）

2. **预算进度条**
   - 直观展示预算使用情况
   - 颜色渐变（绿色→黄色→红色）
   - 超过 80% 显示警告，超过 100% 显示异常

3. **图表可视化**
   - **饼图**: 展示各分类费用占比
   - **折线图**: 展示每日消费趋势
   - 使用 ECharts 实现，交互流畅

4. **费用记录列表**
   - 显示最近 10 条费用记录
   - 每条记录显示：分类图标、描述、日期、金额
   - 支持快速编辑和删除

5. **添加/编辑费用对话框**
   - 7 种费用分类可选（交通、住宿、餐饮、景点门票、购物、娱乐、其他）
   - 金额输入（支持小数）
   - 日期选择器
   - 描述文本框

### 使用方法

在旅行计划详情页中使用：

```vue
<template>
  <BudgetAnalysis 
    :travel-plan-id="planId" 
    @refresh="handleRefresh" 
  />
</template>

<script setup>
import BudgetAnalysis from '@/components/BudgetAnalysis.vue'

const handleRefresh = () => {
  // 刷新旅行计划数据
}
</script>
```

## 费用分类

系统预定义了 7 种费用分类：

| 分类 | 图标 | 说明 |
|------|------|------|
| 交通 | 🚗 | 机票、火车票、打车、租车等 |
| 住宿 | 🏨 | 酒店、民宿、青旅等 |
| 餐饮 | 🍽️ | 早餐、午餐、晚餐、小吃等 |
| 景点门票 | 🎫 | 景区门票、博物馆、游乐项目等 |
| 购物 | 🛍️ | 纪念品、特产、日用品等 |
| 娱乐 | 🎮 | 演出、娱乐活动等 |
| 其他 | 💰 | 其他未分类费用 |

## 数据流程

```
1. 用户查看旅行计划详情
   ↓
2. BudgetAnalysis 组件加载
   ↓
3. 调用 getBudgetAnalysis API
   ↓
4. 后端查询费用记录并计算分析数据
   ↓
5. 返回分析结果
   ↓
6. 前端渲染图表和列表
   ↓
7. 用户添加/编辑/删除费用
   ↓
8. 调用对应的 API
   ↓
9. 刷新分析数据
```

## 最佳实践

### 1. 及时记录费用
- 建议每次消费后立即记录
- 利用手机记录更方便
- 可以拍照保存小票作为凭证

### 2. 合理分类
- 选择正确的费用分类
- 在描述中补充详细信息
- 便于后期分析和总结

### 3. 预算控制
- 定期查看预算使用情况
- 注意预算进度条颜色提示
- 超支时及时调整消费计划

### 4. 数据分析
- 查看饼图了解消费结构
- 关注折线图发现消费高峰
- 参考分类统计优化预算分配

## 技术实现

### 后端技术栈
- **框架**: Next.js 14 + TypeScript
- **数据库**: SQLite + Prisma ORM
- **AI**: OpenAI API（用于预算估算）
- **认证**: JWT Token

### 前端技术栈
- **框架**: Vue 3 + TypeScript
- **UI 库**: Element Plus
- **图表库**: ECharts + vue-echarts
- **状态管理**: Pinia
- **HTTP 客户端**: Axios

### 数据模型

Expense 表结构：
```prisma
model Expense {
  id              String        @id @default(uuid())
  travelPlanId    String
  category        String        // 分类
  amount          Float         // 金额
  currency        String        @default("CNY")
  description     String?       // 描述
  date            DateTime      @default(now())
  createdAt       DateTime      @default(now())
  
  travelPlan      TravelPlan    @relation(fields: [travelPlanId], references: [id], onDelete: Cascade)
}
```

## 常见问题

### Q1: 如何使用 AI 预算估算？
A: AI 预算估算目前在后端已实现，但前端暂未集成到 UI 中。可以通过 API 直接调用，或在后续版本中添加预算估算按钮。

### Q2: 费用记录会自动同步到预算分析吗？
A: 是的，每次添加、编辑或删除费用后，预算分析会自动刷新。

### Q3: 可以导出费用记录吗？
A: 当前版本暂不支持导出功能，计划在 Phase 4 中添加。

### Q4: 支持多种货币吗？
A: 数据模型中有 currency 字段，默认为 CNY（人民币），但前端暂未提供货币切换功能。

### Q5: 如何删除所有费用记录？
A: 需要逐条删除，或者删除整个旅行计划（会级联删除所有费用）。

## 未来规划

Phase 4 计划增强的功能：
- [ ] 语音输入记录费用
- [ ] 费用记录拍照上传小票
- [ ] 费用报表导出（PDF/Excel）
- [ ] 多货币支持和汇率转换
- [ ] 费用预警通知
- [ ] 费用分摊计算（多人旅行）
- [ ] 费用统计对比（与其他旅行对比）

## 总结

Phase 3 的预算与记账功能为旅行计划提供了完整的财务管理能力，帮助用户：
- ✅ 提前估算旅行预算
- ✅ 实时记录旅行费用
- ✅ 可视化分析消费情况
- ✅ 合理控制旅行开支

结合 Phase 1 和 Phase 2 的功能，AI 旅行规划师已经具备了从行程规划、地图可视化到预算管理的完整能力！
