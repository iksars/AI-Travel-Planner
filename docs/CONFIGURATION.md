# 环境配置指南

## 必需配置

### 1. OpenAI API Key（必需）

AI 功能需要 OpenAI API Key 才能正常工作。

**获取方式：**
1. 访问 [OpenAI Platform](https://platform.openai.com/)
2. 注册/登录账号
3. 进入 [API Keys](https://platform.openai.com/api-keys)
4. 创建新的 API Key

**配置方法：**

编辑 `backend/.env` 文件：

```bash
OPENAI_API_KEY="sk-your-actual-api-key-here"
```

**费用说明：**
- 使用 gpt-4o-mini 模型
- 约 $0.15/次生成（具体取决于行程复杂度）
- 建议设置使用限额

### 2. 高德地图 Key（可选）

地图可视化功能使用高德地图，当前使用示例 Key，建议替换为自己的。

**获取方式：**
1. 访问 [高德开放平台](https://lbs.amap.com/)
2. 注册/登录账号
3. 创建应用（Web 端/JS API）
4. 获取 Key

**配置方法：**

编辑 `frontend/src/components/TravelMap.vue` 文件：

```typescript
const AMAP_KEY = 'your-amap-key-here'
```

**说明：**
- 高德地图个人开发者账号每天有配额限制
- 如不配置，地图可能无法正常显示
- 示例 Key 仅用于演示，不保证稳定性

## 可选配置

### 数据库配置

默认使用 SQLite，配置在 `backend/.env`：

```bash
DATABASE_URL="file:./dev.db"
```

如需使用其他数据库（如 PostgreSQL、MySQL），修改此配置并运行迁移：

```bash
cd backend
npx prisma migrate dev
```

### JWT Secret

用于生成用户认证 Token，建议在生产环境修改：

```bash
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
```

生成强密钥：
```bash
openssl rand -base64 32
```

### 前端 API 地址

开发环境配置在 `frontend/.env.development`：

```bash
VITE_API_BASE_URL=http://localhost:3000/api
```

生产环境创建 `frontend/.env.production`：

```bash
VITE_API_BASE_URL=https://your-api-domain.com/api
```

## 配置检查清单

- [ ] OpenAI API Key 已配置（必需）
- [ ] 高德地图 Key 已配置（推荐）
- [ ] JWT Secret 已修改（生产环境必需）
- [ ] 数据库连接正常
- [ ] 前端 API 地址正确
- [ ] 后端服务运行正常（localhost:3000）
- [ ] 前端服务运行正常（localhost:5173）

## 启动步骤

### 1. 安装依赖

```bash
# 后端
cd backend
npm install

# 前端
cd frontend
npm install
```

### 2. 配置环境变量

按照上述说明配置 `.env` 文件

### 3. 初始化数据库

```bash
cd backend
npx prisma migrate dev
```

### 4. 启动服务

**后端：**
```bash
cd backend
npm run dev
# 服务运行在 http://localhost:3000
```

**前端：**
```bash
cd frontend
npm run dev
# 服务运行在 http://localhost:5173
```

### 5. 访问应用

打开浏览器访问：http://localhost:5173

## 故障排查

### OpenAI API 错误

**问题：** AI 生成失败，提示 API 错误

**解决：**
1. 检查 API Key 是否正确配置
2. 确认 API Key 有效且有余额
3. 检查网络连接（国内可能需要代理）
4. 查看后端控制台错误信息

### 地图不显示

**问题：** 地图区域空白或显示错误

**解决：**
1. 检查高德地图 Key 是否配置
2. 打开浏览器控制台查看错误
3. 确认网络可以访问高德服务
4. 检查生成的行程是否包含坐标数据

### CORS 错误

**问题：** 前端请求后端时出现跨域错误

**解决：**
1. 确认后端服务正在运行
2. 检查前端配置的 API 地址
3. 查看 `backend/src/lib/cors.ts` 配置
4. 确保前端地址在允许列表中

### 数据库连接失败

**问题：** Prisma 无法连接数据库

**解决：**
1. 检查 DATABASE_URL 配置
2. 确认数据库文件路径正确
3. 运行 `npx prisma migrate dev`
4. 检查文件系统权限

## 生产环境部署

### 环境变量

生产环境需要设置以下环境变量：

```bash
# 后端
NODE_ENV=production
DATABASE_URL="your-production-database-url"
JWT_SECRET="strong-random-secret"
OPENAI_API_KEY="your-openai-key"

# 前端
VITE_API_BASE_URL="https://api.yourdomain.com/api"
```

### 构建

```bash
# 后端
cd backend
npm run build

# 前端
cd frontend
npm run build
```

### 部署建议

- 后端：部署到 Vercel、Railway、Heroku 等
- 前端：部署到 Vercel、Netlify、Cloudflare Pages 等
- 数据库：使用 PostgreSQL（如 Supabase、Neon）

## 安全建议

1. **不要提交 .env 文件到 Git**
   - 已添加到 `.gitignore`
   - 使用环境变量或密钥管理服务

2. **定期轮换密钥**
   - JWT Secret
   - API Keys

3. **限制 API 使用**
   - OpenAI API 设置使用限额
   - 高德地图设置访问频率限制

4. **使用 HTTPS**
   - 生产环境必须使用 HTTPS
   - 保护用户数据传输安全

## 需要帮助？

- 查看项目 README.md
- 阅读功能指南文档（docs/ 目录）
- 提交 GitHub Issue
- 查看后端/前端控制台日志

## 参考文档

- [OpenAI API 文档](https://platform.openai.com/docs)
- [高德地图 API 文档](https://lbs.amap.com/api/javascript-api-v2/documentation)
- [Prisma 文档](https://www.prisma.io/docs)
- [Next.js 文档](https://nextjs.org/docs)
- [Vue 3 文档](https://vuejs.org/)
