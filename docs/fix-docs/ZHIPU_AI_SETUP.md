# 智谱 AI (GLM) 配置指南

## 概述

本项目已针对智谱 AI (GLM-4) 进行优化，支持使用智谱清言 API 作为 OpenAI 的替代方案。

## 为什么使用智谱 AI？

- ✅ **国内访问友好**: 无需代理，访问稳定
- ✅ **中文理解更好**: 对中文旅行规划的理解更准确
- ✅ **价格实惠**: 相比 OpenAI 更经济
- ✅ **API 兼容**: 兼容 OpenAI SDK

## 配置步骤

### 1. 获取智谱 AI API Key

1. 访问 [智谱 AI 开放平台](https://open.bigmodel.cn/)
2. 注册/登录账号
3. 进入控制台
4. 创建 API Key
5. 复制 API Key（格式如：`fdf42d2ae5c34215b7297d8af44ed8d4.YOvDwMjeGnQfjYOI`）

### 2. 配置环境变量

编辑 `backend/.env` 文件：

```bash
# 智谱 AI 配置
OPENAI_API_KEY="你的智谱AI密钥"
OPENAI_MODEL="glm-4-flash"  # 或 glm-4, glm-4-plus
AI_API_URL="https://open.bigmodel.cn/api/paas/v4"
```

### 3. 可选模型

| 模型 | 速度 | 质量 | 价格 | 推荐场景 |
|-----|------|------|------|---------|
| `glm-4-flash` | ⚡⚡⚡ | ⭐⭐⭐ | 💰 | 快速生成，推荐 |
| `glm-4` | ⚡⚡ | ⭐⭐⭐⭐ | 💰💰 | 标准质量 |
| `glm-4-plus` | ⚡ | ⭐⭐⭐⭐⭐ | 💰💰💰 | 最高质量 |

**推荐**: 使用 `glm-4-flash` 以获得最佳性价比。

## 代码适配

项目已自动识别智谱 AI 并进行适配：

```typescript
// 自动检测 API 提供商
const isZhipuAI = process.env.AI_API_URL?.includes('bigmodel.cn');

// 智谱 AI 不支持 response_format，自动跳过
if (!isZhipuAI) {
  requestParams.response_format = { type: 'json_object' };
}
```

### JSON 提取增强

智谱 AI 可能在 JSON 前后添加文本，已添加自动提取：

```typescript
// 查找第一个 { 和最后一个 }
const firstBrace = content.indexOf('{');
const lastBrace = content.lastIndexOf('}');
const jsonStr = content.substring(firstBrace, lastBrace + 1);
```

## 测试

### 1. 启动服务

```bash
# 后端
cd backend
npm run dev

# 前端
cd frontend
npm run dev
```

### 2. 测试生成

访问 http://localhost:5173，使用以下参数测试：

```json
{
  "destination": "杭州",
  "days": 2,
  "budget": 3000,
  "peopleCount": 2,
  "startDate": "2025-11-10",
  "preferences": ["美食", "文化"]
}
```

### 3. 查看日志

后端控制台会显示：

```
Using AI provider: ZhipuAI (GLM)
Model: glm-4-flash
AI Response (first 500 chars): {"title":"杭州2日游"...
```

## 常见问题

### Q1: 错误 "400 Invalid API parameter"

**原因**: API 参数不兼容

**解决**: 
- 确保使用最新代码（已修复）
- 检查 `OPENAI_MODEL` 是否正确
- 确认 `AI_API_URL` 设置正确

### Q2: 错误 "401 Unauthorized"

**原因**: API Key 无效或过期

**解决**:
- 检查 `OPENAI_API_KEY` 是否正确复制
- 确认 API Key 未过期
- 检查账号余额

### Q3: JSON 解析失败

**原因**: 智谱 AI 返回了额外文本

**解决**: 已自动处理，如仍失败请查看日志

### Q4: 生成内容不完整

**原因**: Token 限制或模型限制

**解决**:
- 减少天数（如从 5 天改为 2 天）
- 使用 `glm-4-plus` 模型
- 简化偏好设置

## 性能对比

### 智谱 AI vs OpenAI

| 指标 | 智谱 GLM-4-Flash | OpenAI GPT-4o-mini |
|-----|-----------------|-------------------|
| 响应时间 | 2-5 秒 | 5-15 秒 |
| 中文质量 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| 坐标准确性 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| 价格 | ¥0.1/千tokens | $0.15/M tokens |
| 国内访问 | ✅ 稳定 | ⚠️ 需代理 |

## 费用估算

### 智谱 AI 定价

- **GLM-4-Flash**: ¥0.1/千tokens（输入），¥0.1/千tokens（输出）
- **GLM-4**: ¥0.5/千tokens（输入），¥0.5/千tokens（输出）
- **GLM-4-Plus**: ¥5/千tokens（输入），¥5/千tokens（输出）

### 实际消耗

生成一个 3 天旅行计划：
- 输入约 800 tokens
- 输出约 2000 tokens
- **GLM-4-Flash 费用**: (800 + 2000) × 0.1 / 1000 = ¥0.28

**对比 OpenAI**: 约 $0.0042 (¥0.03)

**结论**: GLM-4-Flash 稍贵但访问更稳定，综合性价比更高。

## 切换回 OpenAI

如需切换回 OpenAI API：

```bash
# backend/.env
OPENAI_API_KEY="sk-your-openai-key"
OPENAI_MODEL="gpt-4o-mini"
# 注释或删除 AI_API_URL
# AI_API_URL=""
```

代码会自动检测并使用 OpenAI 配置。

## 高级配置

### 自定义 Prompt

如需优化生成质量，编辑 `backend/src/lib/ai.ts`：

```typescript
// 在 buildPrompt 函数中调整
return `
请为以下旅行需求生成一份详细的旅行计划。
// ... 自定义 prompt
`;
```

### 调整 Temperature

```typescript
// 在 generateTravelItinerary 函数中
temperature: 0.5,  // 0.0-1.0，越低越确定，越高越创意
```

### 添加重试机制

```typescript
let retries = 3;
while (retries > 0) {
  try {
    const completion = await openai.chat.completions.create(...);
    break;
  } catch (error) {
    retries--;
    if (retries === 0) throw error;
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}
```

## 监控和日志

### 查看 API 调用

后端控制台输出：

```
Using AI provider: ZhipuAI (GLM)
Model: glm-4-flash
AI Response (first 500 chars): ...
Validating plan structure... { hasTitle: true, ... }
```

### 追踪费用

1. 登录 [智谱 AI 控制台](https://open.bigmodel.cn/)
2. 查看"使用统计"
3. 监控 Token 消耗

## 其他兼容 API

项目也支持其他 OpenAI 兼容 API：

### Deepseek

```bash
OPENAI_API_KEY="your-deepseek-key"
OPENAI_MODEL="deepseek-chat"
AI_API_URL="https://api.deepseek.com/v1"
```

### 通义千问

```bash
OPENAI_API_KEY="your-qwen-key"
OPENAI_MODEL="qwen-plus"
AI_API_URL="https://dashscope.aliyuncs.com/compatible-mode/v1"
```

### 本地模型 (Ollama)

```bash
OPENAI_API_KEY="ollama"  # 任意值
OPENAI_MODEL="qwen2:7b"
AI_API_URL="http://localhost:11434/v1"
```

## 故障排查

### 查看完整错误

```bash
cd backend
npm run dev 2>&1 | tee error.log
```

### 测试 API 连接

```bash
curl -X POST https://open.bigmodel.cn/api/paas/v4/chat/completions \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "glm-4-flash",
    "messages": [{"role": "user", "content": "你好"}]
  }'
```

### 常见错误代码

| 代码 | 含义 | 解决方案 |
|-----|------|---------|
| 1210 | 参数错误 | 已修复，使用最新代码 |
| 1301 | 认证失败 | 检查 API Key |
| 1302 | 余额不足 | 充值账户 |
| 1303 | 请求过快 | 添加限流 |

## 参考资源

- [智谱 AI 官网](https://open.bigmodel.cn/)
- [API 文档](https://open.bigmodel.cn/dev/api)
- [定价说明](https://open.bigmodel.cn/pricing)
- [示例代码](https://github.com/zhipuai/zhipuai-sdk-python-v4)

## 总结

✅ **配置完成清单**:
- [ ] 获取智谱 AI API Key
- [ ] 配置 `backend/.env` 文件
- [ ] 重启后端服务
- [ ] 测试生成功能
- [ ] 查看生成日志
- [ ] 验证地图显示

🎉 **现在可以使用智谱 AI 生成旅行计划了！**
