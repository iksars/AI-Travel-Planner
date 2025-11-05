# AI 旅行规划师 - MVP 开发进度

## 项目概述
基于 PRD 文档的 AI 旅行规划师应用，采用前后端分离架构。

## 技术栈
- **前端**: Vue 3 + TypeScript + Element Plus + Pinia + Vue Router + Axios
- **后端**: Next.js 14 + TypeScript + Prisma ORM
- **数据库**: SQLite

## 已完成功能 (MVP Phase 1 & Phase 2)

### 后端 (Backend)
✅ 数据库设计与迁移
- User（用户）模型
- TravelPlan（旅行计划）模型
- Itinerary（每日行程）模型
- Expense（费用记录）模型

✅ 用户认证 API (US-201)
- POST `/api/auth/register` - 用户注册
- POST `/api/auth/login` - 用户登录
- GET `/api/auth/me` - 获取当前用户信息
- JWT Token 认证机制
- 密码加密（bcrypt）

✅ 旅行计划 CRUD API (US-202)
- GET `/api/travel-plans` - 获取所有旅行计划（支持状态筛选）
- POST `/api/travel-plans` - 创建新旅行计划
- GET `/api/travel-plans/:id` - 获取单个旅行计划详情
- PUT `/api/travel-plans/:id` - 更新旅行计划
- DELETE `/api/travel-plans/:id` - 删除旅行计划

✅ AI 智能行程生成 API (US-102)
- POST `/api/ai/generate-itinerary` - AI 生成旅行计划
- 集成 OpenAI API
- 智能 Prompt 工程
- 结构化数据输出
- 自动保存到数据库

✅ CORS 跨域配置
- 支持前后端分离开发
- 完善的预检请求处理

### 前端 (Frontend)
✅ 项目基础架构
- Vue 3 + TypeScript 项目初始化
- Element Plus UI 组件库集成
- Pinia 状态管理
- Vue Router 路由配置
- Axios HTTP 客户端封装

✅ 用户认证界面
- 登录/注册页面 (`/login`)
- 表单验证
- Auth Store（用户状态管理）
- 路由守卫（认证保护）

✅ 旅行计划管理界面
- 旅行计划列表页 (`/plans`)
- 创建/编辑旅行计划对话框
- 旅行计划卡片展示
- 状态筛选
- 删除确认
- 旅行计划详情页 (`/plans/:id`)
- 每日行程时间线展示
- 活动、交通、住宿、餐饮详细信息

✅ AI 智能规划界面 (US-101, US-102)
- AI 生成页面 (`/ai-generator`)
- 精美渐变背景设计
- 直观的表单输入
- 多种旅行偏好选择
- 实时生成进度显示
- 动画加载效果

✅ 地图可视化功能 (F-301)
- 高德地图集成
- 可复用 TravelMap 组件
- 景点、餐厅、酒店标记（颜色编码）
- 路线绘制与方向指示
- 按天筛选查看
- 信息窗口交互
- 自适应视野调整
- **智能初始视图**：根据位置数量自动调整缩放级别
  - 1 个位置：缩放级别 15（街道细节）
  - 2-5 个位置：缩放级别 13（区域视图）
  - 6+ 个位置：缩放级别 12（城市全局）
- **地图控制**：右上角控制按钮组
  - ➕ 放大按钮
  - ➖ 缩小按钮
  - 🎯 重置视图（自动适配所有标记）
  - 🔄 2D/3D 切换（平面/立体视图）
- **自动居中**：计算所有位置的平均坐标作为地图中心
- **默认 2D 视图**：更适合初次查看整体路线

## 阶段里程碑

### ✅ Phase 1: 基础功能 (已完成 - 2025-01-11)
- 用户认证系统
- 旅行计划 CRUD
- 基础 UI 界面
- CORS 跨域配置

### ✅ Phase 2: AI 核心功能 (已完成 - 2025-01-11)
- ✅ 集成大语言模型 API（OpenAI）
- ✅ 自然语言输入转结构化行程（US-102）
- ✅ AI 智能 Prompt 工程
- ✅ AI 生成界面与交互
- ✅ 行程时间线展示

### ✅ Phase 2 续: 地图可视化 (已完成 - 2025-11-04)
- ✅ 集成高德地图 SDK
- ✅ 创建可复用地图组件（TravelMap.vue）
- ✅ 行程路线可视化（F-301）
- ✅ 景点、餐厅、酒店标记显示
- ✅ 路线绘制和方向指示
- ✅ 信息窗口交互
- ✅ 按天筛选查看
- ✅ AI 坐标数据生成优化
- ✅ 智能初始视图调整（根据位置数量自动缩放）
- ✅ 地图控制功能（放大/缩小/重置/2D-3D 切换）
- ✅ 自动计算地图中心点
- ✅ 优化用户体验（宏观视图+微观视图）

### ✅ Phase 3: 预算与记账功能 (已完成 - 2025-11-05)
- ✅ AI 预算估算 API（US-103）
  - POST `/api/ai/estimate-budget` - AI 智能预算估算
  - 根据目的地、天数、人数、旅行风格生成预算
  - 提供详细的预算分类和省钱建议
- ✅ 费用记录 CRUD API（US-104）
  - GET `/api/expenses?travelPlanId=xxx` - 获取费用列表
  - POST `/api/expenses` - 创建费用记录
  - GET `/api/expenses/:id` - 获取单条费用
  - PUT `/api/expenses/:id` - 更新费用记录
  - DELETE `/api/expenses/:id` - 删除费用记录
- ✅ 预算分析 API
  - GET `/api/travel-plans/:id/budget-analysis` - 预算使用分析
  - 总预算、已花费、剩余预算统计
  - 按分类统计费用占比
  - 每日消费趋势分析
- ✅ 预算分析界面组件（BudgetAnalysis.vue）
  - 预算概览卡片（总预算、已花费、剩余、使用比例）
  - 预算使用进度条
  - ECharts 图表可视化
    - 饼图展示分类占比
    - 折线图展示每日消费趋势
  - 费用记录列表
  - 添加/编辑/删除费用对话框
  - 7种费用分类（交通、住宿、餐饮、景点门票、购物、娱乐、其他）
- ✅ 费用记录 API 客户端（expenses.ts）
- ✅ 集成到旅行计划详情页

## 待实现功能 (后续阶段)

### Phase 4: 高级功能（待开发）

---

#### Phase 4: 高级功能详细规划

- [ ] 语音输入集成（科大讯飞/阿里云）
  - 用于费用记录和行程偏好输入
  - 支持移动端和桌面端
  - 语音识别准确率优化，UI 动效反馈
  - 失败时自动切换文字输入

- [ ] 每日行程详细编辑功能
  - 支持用户对 AI 生成的每日行程进行手动微调
  - 可增删活动、调整时间、修改交通/住宿/餐饮
  - 拖拽排序、可视化时间线编辑
  - 编辑后自动同步地图和预算分析

- [ ] 推荐算法优化
  - 基于用户历史偏好、行为数据优化推荐
  - 增加目的地、景点、餐厅个性化推荐
  - 支持“猜你喜欢”功能
  - 后台可配置推荐白名单/干预机制

- [ ] 社交分享功能
  - 支持一键分享行程到微信、微博等社交平台
  - 生成精美分享卡片（含地图、行程摘要）
  - 可生成公开链接，支持他人查看/复制行程

- [ ] 后台管理面板
  - 用户管理：查看/禁用用户
  - 内容配置：推荐目的地、优质餐厅/酒店管理
  - 数据看板：用户数、行程数、热门目的地统计
  - 行程内容审核与干预

- [ ] 实时旅行辅助
  - 天气预警：集成天气 API，行程中实时提示
  - 交通提醒：集成高德/百度路况 API，显示实时交通状况
  - 关键节点推送提醒（如航班、景点开放时间）

---

##### 实现建议

- 语音输入建议优先集成成熟云服务（如科大讯飞），前端提供录音按钮和动效，后端处理语音转文本。
- 行程编辑建议采用拖拽式 UI，结合地图和时间线组件，保证交互流畅。
- 推荐算法可先用规则+标签，后续逐步引入机器学习模型。
- 分享功能需注意隐私保护，默认不公开用户敏感信息。
- 后台管理建议用 Element Plus + Vue3 快速搭建，权限分级。
- 实时辅助需合理控制 API 调用频率，避免性能瓶颈。

## 如何运行项目

### 后端
```bash
cd backend
npm install
npm run dev
```
后端服务将运行在 `http://localhost:3000`

### 前端
```bash
cd frontend
npm install
npm run dev
```
前端服务将运行在 `http://localhost:5173`

## 环境变量配置

### 后端 (.env)
```
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
OPENAI_API_KEY="sk-your-openai-api-key"  # 从 https://platform.openai.com/api-keys 获取
```

### 前端 (.env.development)
```
VITE_API_BASE_URL=http://localhost:3000/api
```

## API 文档

### 认证接口
- `POST /api/auth/register` - 注册
- `POST /api/auth/login` - 登录
- `GET /api/auth/me` - 获取用户信息（需要认证）

### 旅行计划接口
- `GET /api/travel-plans` - 获取旅行计划列表（需要认证）
- `POST /api/travel-plans` - 创建旅行计划（需要认证）
- `GET /api/travel-plans/:id` - 获取旅行计划详情（需要认证）
- `PUT /api/travel-plans/:id` - 更新旅行计划（需要认证）
- `DELETE /api/travel-plans/:id` - 删除旅行计划（需要认证）
- `GET /api/travel-plans/:id/budget-analysis` - 获取预算分析（需要认证）

### AI 智能生成接口
- `POST /api/ai/generate-itinerary` - AI 生成旅行行程（需要认证）
  - 请求体：
    ```json
    {
      "destination": "目的地",
      "days": 3,
      "budget": 5000,
      "preferences": "美食、文化"
    }
    ```
  - 返回：完整旅行计划对象，包含每日行程

- `POST /api/ai/estimate-budget` - AI 估算旅行预算（需要认证）
  - 请求体：
    ```json
    {
      "destination": "目的地",
      "days": 3,
      "peopleCount": 2,
      "preferences": ["美食", "文化"],
      "travelStyle": "moderate"
    }
    ```
  - 返回：预算估算，包含分类明细和建议

### 费用记录接口
- `GET /api/expenses?travelPlanId=xxx` - 获取费用记录列表（需要认证）
- `POST /api/expenses` - 创建费用记录（需要认证）
  - 请求体：
    ```json
    {
      "travelPlanId": "计划ID",
      "category": "交通",
      "amount": 100,
      "currency": "CNY",
      "description": "打车费用",
      "date": "2025-11-05"
    }
    ```
- `GET /api/expenses/:id` - 获取单条费用记录（需要认证）
- `PUT /api/expenses/:id` - 更新费用记录（需要认证）
- `DELETE /api/expenses/:id` - 删除费用记录（需要认证）

详细 AI 功能说明请参阅 [AI 功能使用指南](./fix-docs/AI_FEATURE_GUIDE.md)

详细地图功能说明请参阅 [地图可视化指南](./fix-docs/MAP_FEATURE_GUIDE.md)

## 数据库模式

见 `backend/prisma/schema.prisma` 文件。

## 下一步计划

1. ✅ Phase 1 & 2 核心功能已完成
2. ✅ 地图可视化功能已完成
3. ✅ Phase 3 预算与记账功能已完成
4. 配置 OpenAI API Key（在 `backend/.env` 中）
5. 配置高德地图 Key（在 `TravelMap.vue` 中，可选）
6. 测试所有功能
7. **Phase 4**：语音输入、社交分享等高级功能

## 贡献者
开发团队

## 许可证
MIT
