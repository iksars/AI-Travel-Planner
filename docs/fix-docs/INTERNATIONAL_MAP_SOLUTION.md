# 国际地图显示解决方案

## 问题描述

高德地图在显示中国境外地点时会出现空白或无法正常显示的问题。这是因为：

1. **地图数据覆盖范围**：高德地图主要服务于中国大陆地区，海外地图数据有限
2. **地图瓦片加载**：海外区域可能没有详细的地图瓦片数据
3. **服务限制**：高德地图的 API 服务主要针对中国市场

## 当前实现的方案

### 方案1：海外地点检测与提示 ✅ (已实现)

**功能：**
- 自动检测行程中是否包含海外地点（经纬度范围：中国大陆 73°E-135°E, 18°N-54°N）
- 如果检测到海外地点，显示警告提示用户
- 提示用户使用 Google Maps 等国际地图服务

**优点：**
- 实现简单，不需要额外的 API
- 给用户明确的反馈

**缺点：**
- 海外地点仍然无法正常显示

## 未来可选方案

### 方案2：集成多地图服务

根据地点位置自动切换地图服务：

**技术方案：**
```typescript
// 根据坐标判断使用哪个地图
const getMapProvider = (locations: Location[]) => {
  const hasOverseas = locations.some(loc => !isInChina(loc.coordinates))
  return hasOverseas ? 'google' : 'amap'
}
```

**需要的服务：**
- 国内：高德地图 (已有)
- 国际：Google Maps / OpenStreetMap / Mapbox

**实现步骤：**
1. 注册 Google Maps API Key
2. 创建 GoogleMap 组件
3. 在 TravelMap 中根据地点动态选择地图组件
4. 统一标记点和路线的接口

**参考代码结构：**
```vue
<template>
  <component 
    :is="mapComponent"
    :locations="locations"
    :center="center"
    :zoom="zoom"
  />
</template>

<script setup>
const mapComponent = computed(() => {
  const hasOverseas = checkOverseasLocations()
  return hasOverseas ? GoogleMap : AMapComponent
})
</script>
```

### 方案3：使用开源地图库 (OpenStreetMap)

**优点：**
- 全球覆盖
- 免费使用
- 无 API 调用限制

**推荐库：**
- Leaflet.js + OpenStreetMap
- Mapbox GL JS

**示例代码：**
```bash
npm install leaflet @types/leaflet
```

```typescript
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const map = L.map('map').setView([51.505, -0.09], 13)

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map)
```

## 推荐实施路线

### 阶段1：当前状态 ✅
- [x] 检测海外地点并提示用户
- [x] 在中国境内正常使用高德地图

### 阶段2：短期优化（推荐）
- [ ] 集成 Leaflet.js + OpenStreetMap
- [ ] 自动切换地图服务（国内用高德，国外用 OpenStreetMap）
- [ ] 统一标记点样式和交互

### 阶段3：长期优化
- [ ] 集成 Google Maps（需要付费 API）
- [ ] 支持用户手动切换地图服务
- [ ] 优化海外路线规划功能

## 代码示例：切换地图服务

```vue
<!-- TravelMapWrapper.vue -->
<template>
  <div class="map-wrapper">
    <!-- 地图切换按钮 -->
    <div v-if="hasMultipleProviders" class="map-provider-switch">
      <el-radio-group v-model="mapProvider" size="small">
        <el-radio-button label="amap">高德地图</el-radio-button>
        <el-radio-button label="osm">OpenStreetMap</el-radio-button>
      </el-radio-group>
    </div>

    <!-- 动态地图组件 -->
    <component 
      :is="currentMapComponent"
      :locations="locations"
      :center="center"
      :zoom="zoom"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import TravelMap from './TravelMap.vue'
import OpenStreetMap from './OpenStreetMap.vue'

const props = defineProps<{
  locations: Location[]
  center?: [number, number]
  zoom?: number
}>()

const mapProvider = ref<'amap' | 'osm'>('amap')

const hasOverseas = computed(() => {
  return props.locations.some(loc => {
    if (!loc.coordinates) return false
    const [lng, lat] = loc.coordinates
    return !(lng >= 73 && lng <= 135 && lat >= 18 && lat <= 54)
  })
})

const currentMapComponent = computed(() => {
  return mapProvider.value === 'amap' ? TravelMap : OpenStreetMap
})

const hasMultipleProviders = computed(() => true) // 当实现多地图后启用
</script>
```

## 相关资源

- [高德地图 API 文档](https://lbs.amap.com/api/javascript-api/summary)
- [Leaflet.js 文档](https://leafletjs.com/)
- [OpenStreetMap](https://www.openstreetmap.org/)
- [Google Maps Platform](https://developers.google.com/maps)
- [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/)

## 注意事项

1. **API 费用**：Google Maps 需要付费，有免费额度限制
2. **服务稳定性**：OpenStreetMap 免费但可能有访问限制
3. **国内访问**：Google Maps 在中国大陆访问受限
4. **地图样式**：不同地图服务的样式和功能有差异
5. **坐标系统**：注意不同地图服务使用的坐标系统（WGS84 vs GCJ02）

## 当前状态

- ✅ 已实现海外地点检测
- ✅ 已添加用户提示
- ⏳ 待实现多地图服务切换
- ⏳ 待集成 OpenStreetMap

---

**更新日期：** 2025-11-04  
**维护者：** AI-Travel-Planner Team
