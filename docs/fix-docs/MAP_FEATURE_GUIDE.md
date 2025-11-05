# 地图可视化功能使用指南

## 功能概述

地图可视化功能将 AI 生成的旅行行程在地图上直观展示，包括：
- 🗺️ 景点、餐厅、酒店位置标记
- 🛣️ 行程路线绘制
- 📍 按天查看或查看全部路线
- 💬 点击标记查看详细信息

## 技术实现

### 地图服务
- **提供商**: 高德地图（AMap）
- **SDK**: @amap/amap-jsapi-loader
- **版本**: 2.0
- **特性**: 支持 3D 视图、标记、路线、信息窗口

### 核心组件

#### TravelMap.vue
可复用的地图组件，支持：
- 自动加载和初始化地图
- 动态添加/更新标记
- 绘制行程路线
- 信息窗口显示
- 自适应视野调整

**Props:**
```typescript
interface Props {
  locations?: Location[]      // 位置列表
  center?: [number, number]   // 地图中心 [经度, 纬度]
  zoom?: number              // 缩放级别 (默认: 12)
}
```

**Location 数据结构:**
```typescript
interface Location {
  name: string                // 地点名称
  type: 'attraction' | 'hotel' | 'restaurant' | 'transport'
  coordinates?: [number, number]  // [经度, 纬度]
  address?: string           // 地址
  description?: string       // 描述
  time?: string             // 时间
  day?: number              // 所属天数
}
```

## 使用说明

### 1. 配置高德地图 Key

高德地图需要 API Key，当前使用的是示例 Key，建议替换为自己的：

1. 访问 [高德开放平台](https://lbs.amap.com/)
2. 注册账号并创建应用
3. 获取 Web 端 JS API Key
4. 在 `TravelMap.vue` 中替换：

```typescript
const AMAP_KEY = '你的高德地图Key'
```

### 2. AI 生成带坐标的行程

在 AI 生成行程时，系统会自动要求 AI 提供每个地点的经纬度坐标：

```typescript
{
  "activities": [{
    "name": "故宫",
    "location": "北京市东城区景山前街4号",
    "coordinates": {
      "lat": 39.916345,
      "lng": 116.397155
    }
  }]
}
```

### 3. 在详情页查看地图

在旅行计划详情页，如果行程包含坐标信息，将自动显示地图：

- **全部路线**: 显示所有天数的所有地点和连接路线
- **按天查看**: 点击"第N天"按钮，只显示该天的行程
- **交互功能**: 点击地图标记查看详细信息

### 4. 地图图例

不同类型的地点使用不同颜色标记：

| 类型 | 颜色 | 说明 |
|-----|------|------|
| 🔴 景点 | #FF6B6B | 旅游景点、博物馆等 |
| 🔵 酒店 | #4ECDC4 | 住宿地点 |
| 🟡 餐厅 | #FFD93D | 用餐地点 |
| 🟢 交通 | #95E1D3 | 交通换乘点 |

## 功能特性

### 1. 智能标记
- 自动按序号标记 (1, 2, 3...)
- 颜色区分不同类型
- 标签显示地点名称

### 2. 路线绘制
- 自动连接所有地点
- 显示方向箭头
- 蓝色路线，易于识别

### 3. 信息窗口
点击标记后显示：
- 地点名称
- 地点类型
- 访问时间
- 详细地址
- 描述信息

### 4. 视野自适应
- 自动计算最佳缩放级别
- 确保所有标记都在可视范围内
- 支持手动缩放和拖动

### 5. 按天筛选
- 查看单日行程路线
- 快速切换不同天数
- 减少地图标记密度

## 开发指南

### 扩展地图功能

#### 1. 添加更多地图服务
可以集成其他地图服务（百度地图、腾讯地图等）：

```typescript
// 创建 BaiduMap.vue 组件
// 遵循相同的 Props 接口
// 在 PlanDetailView.vue 中切换使用
```

#### 2. 自定义标记样式

在 `TravelMap.vue` 中修改 `markerColors` 对象：

```typescript
const markerColors: Record<string, string> = {
  attraction: '#自定义颜色',
  // ...
}
```

#### 3. 添加地理编码功能

组件已暴露 `geocode` 方法，可以将地址转换为坐标：

```vue
<script setup>
const mapRef = ref()

// 使用地理编码
const coords = await mapRef.value?.geocode('北京市天安门')
console.log(coords) // [116.397428, 39.90923]
</script>

<template>
  <TravelMap ref="mapRef" ... />
</template>
```

#### 4. 添加路线规划

可以使用高德地图的路线规划 API：

```typescript
// 在 TravelMap.vue 中添加
AMap.plugin('AMap.Driving', function() {
  const driving = new AMap.Driving({
    // 配置选项
  })
  
  driving.search(origin, destination, (status, result) => {
    // 处理结果
  })
})
```

## 性能优化

### 1. 标记聚合
当地点过多时，可以使用标记聚合：

```typescript
AMap.plugin('AMap.MarkerCluster', function() {
  new AMap.MarkerCluster(map, markers, {
    gridSize: 80
  })
})
```

### 2. 懒加载地图
只在需要时加载地图 SDK：

```typescript
// 当用户滚动到地图区域时才加载
const observer = new IntersectionObserver((entries) => {
  if (entries[0].isIntersecting) {
    loadMap()
    observer.disconnect()
  }
})
```

### 3. 缓存坐标数据
避免重复的地理编码请求：

```typescript
const coordsCache = new Map<string, [number, number]>()

async function getCoordsWithCache(address: string) {
  if (coordsCache.has(address)) {
    return coordsCache.get(address)
  }
  
  const coords = await geocode(address)
  if (coords) {
    coordsCache.set(address, coords)
  }
  return coords
}
```

## 常见问题

### Q1: 地图不显示或加载失败
**原因**: 
- 高德地图 Key 无效或未配置
- 网络连接问题
- 浏览器控制台报错

**解决方案**:
1. 检查 `AMAP_KEY` 是否正确配置
2. 查看浏览器控制台的错误信息
3. 确认高德地图服务可访问

### Q2: 坐标信息缺失
**原因**: 
- AI 生成的行程没有包含坐标
- 坐标格式不正确

**解决方案**:
1. 重新生成行程（AI prompt 已优化）
2. 手动添加坐标（使用地理编码）
3. 检查数据库中的坐标字段

### Q3: 标记位置不准确
**原因**: 
- AI 提供的坐标有误差
- 地址解析不准确

**解决方案**:
1. 使用更具体的地址描述
2. 手动修正坐标
3. 使用高德地图的地点搜索 API

### Q4: 地图性能问题
**原因**: 
- 标记点过多
- 路线过于复杂

**解决方案**:
1. 使用按天筛选减少标记数量
2. 启用标记聚合功能
3. 优化路线算法

## API 参考

### TravelMap 组件方法

#### geocode(address: string)
将地址转换为经纬度坐标

```typescript
const coords = await mapRef.value?.geocode('北京市天安门')
// 返回: [116.397428, 39.90923] 或 null
```

#### fitView()
调整地图视野以显示所有标记

```typescript
mapRef.value?.fitView()
```

### 高德地图文档
- [官方文档](https://lbs.amap.com/api/javascript-api-v2/documentation)
- [示例中心](https://lbs.amap.com/demo/javascript-api-v2/example/map/map-show)
- [开发指南](https://lbs.amap.com/api/javascript-api-v2/guide/abc/prepare)

## 未来规划

- [ ] 支持多种地图服务切换
- [ ] 实时路况显示
- [ ] 导航功能集成
- [ ] 附近景点推荐
- [ ] 用户自定义标记
- [ ] 行程轨迹回放
- [ ] 分享地图到社交平台
- [ ] 离线地图支持

## 贡献指南

如果你想改进地图功能：

1. Fork 项目仓库
2. 创建功能分支
3. 实现新功能并测试
4. 提交 Pull Request
5. 更新此文档

## 许可证

MIT License
