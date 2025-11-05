# 地图功能快速参考

## 🎯 一分钟快速上手

### 开发者快速配置
```bash
# 1. 安装依赖（已完成）
cd frontend && npm install @amap/amap-jsapi-loader

# 2. 配置高德地图 Key
# 编辑 frontend/src/components/TravelMap.vue
const AMAP_KEY = 'your-amap-key'  # 第 53 行

# 3. 启动服务即可使用
cd backend && npm run dev    # Terminal 1
cd frontend && npm run dev   # Terminal 2
```

### 用户快速体验
```
1. 访问 http://localhost:5173
2. 登录系统
3. 点击"AI 智能生成"
4. 填写目的地（如：北京）
5. 等待生成
6. 查看详情页的地图！
```

## 📋 关键文件速查

| 文件 | 作用 | 重要性 |
|-----|------|--------|
| `TravelMap.vue` | 地图组件 | ⭐⭐⭐ |
| `PlanDetailView.vue` | 详情页（集成地图） | ⭐⭐⭐ |
| `ai.ts` | AI Prompt（含坐标） | ⭐⭐ |
| `MAP_FEATURE_GUIDE.md` | 完整功能文档 | 📖 |
| `MAP_TESTING_GUIDE.md` | 测试指南 | 🧪 |

## 🎨 标记颜色速记

```
🔴 #FF6B6B - 景点 (attraction)
🔵 #4ECDC4 - 酒店 (hotel)
🟡 #FFD93D - 餐厅 (restaurant)
🟢 #95E1D3 - 交通 (transport)
```

修改位置：`TravelMap.vue` 第 58-63 行

## 🔧 常用配置

### 地图样式
```typescript
// TravelMap.vue 第 96 行
mapStyle: 'amap://styles/normal'  // 可选：dark, light, fresh 等
```

### 初始视图
```typescript
// TravelMap.vue 第 92-95 行
zoom: 12,          // 缩放级别 (3-18)
viewMode: '3D',    // 2D 或 3D
pitch: 50,         // 俯仰角 (0-83)
rotation: 0        // 旋转角度 (0-360)
```

### 坐标格式
```typescript
// 正确格式 [经度, 纬度]
coordinates: [116.397428, 39.90923]

// 北京范围
lng: 116.0 ~ 117.0
lat: 39.4 ~ 41.0
```

## 🐛 快速排错

### 问题：地图不显示
```bash
# 检查清单
1. [ ] 控制台是否有错误？
2. [ ] 高德地图 Key 是否配置？
3. [ ] 网络是否可访问高德服务？
4. [ ] 数据是否包含坐标？
```

### 问题：缺少坐标
```bash
# 解决方案
1. 重新 AI 生成行程（Prompt 已优化）
2. 检查数据：console.log(mapLocations.value)
3. 使用地理编码：await mapRef.value?.geocode('地址')
```

### 问题：标记位置不准
```bash
# 检查坐标
- 经度范围：-180 到 180
- 纬度范围：-90 到 90
- 北京约：[116.4, 39.9]
- 上海约：[121.5, 31.2]
```

## 📱 交互操作速查

| 操作 | 桌面端 | 移动端 | 按钮控制 |
|-----|--------|--------|----------|
| 移动地图 | 鼠标拖拽 | 单指拖动 | - |
| 缩放 | 滚轮 | 双指缩放 | ➕➖ 按钮 |
| 旋转 | 右键拖动 | 双指旋转 | - |
| 查看详情 | 点击标记 | 点击标记 | - |
| 切换天数 | 点击按钮 | 点击按钮 | - |
| 重置视图 | - | - | 🎯 重置视图 |
| 2D/3D 切换 | - | - | 🔄 2D/3D |

### 🎮 新增地图控制（右上角）
- **➕ 放大**：逐级放大地图，查看更多细节
- **➖ 缩小**：逐级缩小地图，查看更大范围
- **🎯 重置视图**：自动适配所有标记，最佳查看角度
- **🔄 2D/3D**：切换平面视图（适合看路线）和立体视图（适合看地形）

### 🎯 智能初始视图
地图会根据位置数量自动调整：
- **1 个位置**：缩放级别 15（街道级别）
- **2-5 个位置**：缩放级别 13（区域级别）
- **6+ 个位置**：缩放级别 12（城市级别）
- **默认视图**：2D 模式，方便查看整体路线

## 🎯 核心 API

### TravelMap 组件
```vue
<TravelMap
  :locations="locations"    // 位置数组
  :center="[116.4, 39.9]"  // 地图中心
  :zoom="13"               // 缩放级别
/>
```

### Location 对象
```typescript
{
  name: '天安门',
  type: 'attraction',      // 必须：attraction | hotel | restaurant | transport
  coordinates: [116, 39],  // 必须：[lng, lat]
  address: '北京市...',
  description: '描述',
  time: '09:00',
  day: 1
}
```

### 暴露方法
```typescript
const mapRef = ref()

// 地理编码
const coords = await mapRef.value?.geocode('北京天安门')

// 自适应视野
mapRef.value?.fitView()
```

## 📊 性能指标

| 指标 | 目标值 | 备注 |
|-----|--------|------|
| SDK 加载 | < 3s | 首次加载 |
| 地图渲染 | < 2s | 初始化 |
| 标记添加 | < 1s | 50个以内 |
| 交互响应 | < 100ms | 点击/拖动 |
| 内存占用 | < 150MB | 100个标记 |

## 🔗 快速链接

### 在线文档
- [高德地图示例](https://lbs.amap.com/demo/javascript-api-v2/example/map/map-show)
- [OpenAI API](https://platform.openai.com/docs)

### 项目文档
- [完整功能指南](./docs/MAP_FEATURE_GUIDE.md)
- [测试指南](./MAP_TESTING_GUIDE.md)
- [配置说明](./CONFIGURATION.md)

### 开发工具
- 高德地图控制台: https://console.amap.com/
- OpenAI 控制台: https://platform.openai.com/

## 💡 开发技巧

### 调试地图
```javascript
// 在浏览器控制台
console.log('Map:', map)
console.log('Markers:', markers)
console.log('Locations:', mapLocations.value)
```

### 查看坐标
```javascript
// 点击地图获取坐标
map.on('click', (e) => {
  console.log(e.lnglat.lng, e.lnglat.lat)
})
```

### 测试地理编码
```javascript
// 使用组件方法
const coords = await mapRef.value?.geocode('故宫')
console.log(coords)  // [116.397155, 39.916345]
```

## ⚡ 性能优化技巧

### 减少标记数量
```typescript
// 使用按天筛选
viewMode.value = 1  // 只显示第1天
```

### 标记聚合（大量标记时）
```typescript
// 在 TravelMap.vue 中添加
AMap.plugin('AMap.MarkerCluster', () => {
  new AMap.MarkerCluster(map, markers, { gridSize: 80 })
})
```

### 延迟加载
```typescript
// 只在需要时加载地图
<TravelMap v-if="showMap" ... />
```

## 🎓 学习路径

1. **基础使用** (10分钟)
   - 查看现有地图
   - 切换不同视图
   - 点击标记查看信息

2. **配置定制** (30分钟)
   - 修改地图样式
   - 调整标记颜色
   - 自定义信息窗口

3. **功能扩展** (2小时)
   - 添加路线规划
   - 集成其他地图服务
   - 实现标记聚合

4. **性能优化** (4小时)
   - 懒加载优化
   - 缓存机制
   - 内存管理

## 🎉 快速测试命令

```bash
# 完整测试流程
curl http://localhost:3000/api/auth/register -d '{"email":"test@test.com","password":"123456"}'
curl http://localhost:3000/api/auth/login -d '{"email":"test@test.com","password":"123456"}'
# 访问 http://localhost:5173/ai-generator
# 生成行程并查看地图
```

## 📞 获取帮助

遇到问题？
1. 查看 [常见问题](./docs/MAP_FEATURE_GUIDE.md#常见问题)
2. 阅读 [故障排查](./CONFIGURATION.md#故障排查)
3. 查看控制台错误信息
4. 提交 GitHub Issue

---

**记住：高德地图 Key 和 OpenAI Key 是必需的！** 🔑

**快速开始链接**：
- 📖 [详细文档](./docs/MAP_FEATURE_GUIDE.md)
- 🧪 [测试指南](./MAP_TESTING_GUIDE.md)
- ⚙️ [配置说明](./CONFIGURATION.md)
