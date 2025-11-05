<template>
  <div class="travel-map-container">
    <div ref="mapContainer" class="map-container"></div>
    
    <!-- 地图控制按钮 -->
    <div class="map-controls">
      <el-button-group>
        <el-button 
          size="small" 
          :icon="ZoomIn" 
          @click="zoomIn"
          title="放大"
        />
        <el-button 
          size="small" 
          :icon="ZoomOut" 
          @click="zoomOut"
          title="缩小"
        />
        <el-button 
          size="small" 
          @click="resetView"
          title="重置视图"
        >
          <el-icon><Aim /></el-icon>
        </el-button>
        <el-button 
          size="small" 
          @click="toggleViewMode"
          title="切换 2D/3D"
        >
          {{ viewMode === '3D' ? '2D' : '3D' }}
        </el-button>
      </el-button-group>
    </div>
    
    <div v-if="loading" class="map-loading">
      <el-icon class="is-loading"><Loading /></el-icon>
      <span>地图加载中...</span>
    </div>
    
    <!-- 海外地区提示 -->
    <div v-if="showOverseasWarning" class="overseas-warning">
      <el-alert
        title="提示"
        type="warning"
        :closable="false"
        show-icon
      >
        <template #default>
          <p>检测到行程包含海外地点，高德地图对海外地区支持有限。</p>
          <p>建议使用 Google Maps 或其他国际地图服务查看完整路线。</p>
        </template>
      </el-alert>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import AMapLoader from '@amap/amap-jsapi-loader'
import { Loading, ZoomIn, ZoomOut, Aim } from '@element-plus/icons-vue'

interface Location {
  name: string
  type: 'attraction' | 'hotel' | 'restaurant' | 'transport'
  coordinates?: [number, number]
  address?: string
  description?: string
  time?: string
}

interface Props {
  locations?: Location[]
  center?: [number, number]
  zoom?: number
}

const props = withDefaults(defineProps<Props>(), {
  locations: () => [],
  center: () => [116.397428, 39.90923],
  zoom: 13
})

const mapContainer = ref<HTMLDivElement>()
const loading = ref(true)
const viewMode = ref<'2D' | '3D'>('2D')
const showOverseasWarning = ref(false)
let map: any = null
let AMap: any = null
const markers: any[] = []
let polyline: any = null

const AMAP_KEY = 'e4c0fa17af0a5c21e9b0bfe914052f43'

const markerColors: Record<string, string> = {
  attraction: '#FF6B6B',
  hotel: '#4ECDC4',
  restaurant: '#FFD93D',
  transport: '#95E1D3'
}

const getOptimalZoom = () => {
  if (props.locations.length === 0) return props.zoom || 13
  if (props.locations.length === 1) return 15
  if (props.locations.length <= 5) return 14
  return 13
}

const zoomIn = () => {
  if (map) {
    map.zoomIn()
  }
}

const zoomOut = () => {
  if (map) {
    map.zoomOut()
  }
}

const resetView = () => {
  map.setZoomAndCenter(getOptimalZoom(), calculateCenter())
}

const toggleViewMode = () => {
  if (!map) return

  if (viewMode.value === '2D') {
    viewMode.value = '3D'
    map.setViewMode('3D')
    map.setPitch(50)
  } else {
    viewMode.value = '2D'
    map.setViewMode('2D')
    map.setPitch(0)
  }
}

const calculateCenter = (): [number, number] => {
  if (props.locations.length === 0) {
    return props.center
  }

  const validLocations = props.locations.filter(loc => loc.coordinates)
  if (validLocations.length === 0) {
    return props.center
  }

  const avgLng = validLocations.reduce((sum, loc) => sum + (loc.coordinates![0] || 0), 0) / validLocations.length
  const avgLat = validLocations.reduce((sum, loc) => sum + (loc.coordinates![1] || 0), 0) / validLocations.length

  return [avgLng, avgLat]
}

// 检测是否为中国境内坐标
const isInChina = (lng: number, lat: number): boolean => {
  // 中国大陆经纬度范围（粗略估算）
  // 经度：73°E - 135°E
  // 纬度：18°N - 54°N
  return lng >= 73 && lng <= 135 && lat >= 18 && lat <= 54
}

// 检测是否有海外地点
const checkOverseasLocations = () => {
  const validLocations = props.locations.filter(loc => loc.coordinates)
  
  if (validLocations.length === 0) {
    showOverseasWarning.value = false
    return
  }

  const hasOverseas = validLocations.some(loc => {
    const [lng, lat] = loc.coordinates!
    return !isInChina(lng, lat)
  })

  showOverseasWarning.value = hasOverseas
}

const loadMap = async () => {
  try {
    loading.value = true
    
    // 检测是否有海外地点
    checkOverseasLocations()
    
    AMap = await AMapLoader.load({
      key: AMAP_KEY,
      version: '2.0',
      plugins: ['AMap.Geocoder', 'AMap.ToolBar', 'AMap.Scale']
    })

    const initialZoom = props.locations.length > 0 ? getOptimalZoom() : props.zoom
    const initialCenter = props.locations.length > 0 ? calculateCenter() : props.center

    map = new AMap.Map(mapContainer.value, {
      zoom: initialZoom,
      center: initialCenter,
      viewMode: '2D',
      pitch: 0,
      rotation: 0,
      mapStyle: 'amap://styles/normal',
      zooms: [3, 20],
      resizeEnable: true,
      preserveDrawingBuffer: true, // 尝试解决 getImageData 性能警告
    })

    // 监听地图加载完成事件
    map.on('complete', () => {
      console.log('地图加载完成');
      loading.value = false;

      // 添加控件
      AMap.plugin(['AMap.ToolBar', 'AMap.Scale'], () => {
        map.addControl(new AMap.ToolBar({ position: 'RB' }))
        map.addControl(new AMap.Scale())
      })

      // 如果有初始位置数据，则添加标记并聚焦
      if (props.locations.length > 0) {
        addMarkers(props.locations)
        drawRoute(props.locations)
        nextTick(() => {
          // fitView()
        })
      }
    });

    map.on('error', (e: any) => {
      console.error('地图加载失败:', e)
      loading.value = false
    });

  } catch (error) {
    console.error('地图加载器初始化失败:', error)
    loading.value = false
  }
}

const addMarkers = (locations: Location[]) => {
  if (!AMap || !map) return

  markers.forEach(marker => marker.setMap(null))
  markers.length = 0

  locations.forEach((location, index) => {
    if (!location.coordinates) return

    const [lng, lat] = location.coordinates
    const color = markerColors[location.type] || '#95E1D3'
    
    const content = `
      <div style="
        width: 20px;
        height: 20px;
        background: ${color};
        border: 2px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 10px;
        font-weight: bold;
      ">
        ${index + 1}
      </div>
    `

    const marker = new AMap.Marker({
      position: [lng, lat],
      content,
      offset: new AMap.Pixel(-10, -10)
    })

    marker.on('click', () => {
      showInfoWindow(marker, location)
    })

    marker.setMap(map)
    markers.push(marker)
  })
}

const drawRoute = (locations: Location[]) => {
  if (!map || !AMap || locations.length < 2) return

  const path = locations
    .filter(loc => loc.coordinates)
    .map(loc => loc.coordinates)

  if (path.length < 2) return

  if (polyline) {
    polyline.setMap(null)
  }

  polyline = new AMap.Polyline({
    path,
    strokeColor: '#3b82f6',
    strokeWeight: 4,
    strokeOpacity: 0.8,
    lineJoin: 'round',
    lineCap: 'round',
    strokeStyle: 'solid',
    showDir: true
  })

  polyline.setMap(map)
}

const showInfoWindow = (marker: any, location: Location) => {
  if (!AMap || !map) return

  const content = `
    <div style="padding: 12px; min-width: 200px;">
      <div style="font-size: 16px; font-weight: bold; margin-bottom: 8px; color: #333;">
        ${location.name}
      </div>
      <div style="font-size: 14px; color: #666;">
        ${location.time ? `<p style="margin: 4px 0;"><strong>时间:</strong> ${location.time}</p>` : ''}
        ${location.address ? `<p style="margin: 4px 0;"><strong>地址:</strong> ${location.address}</p>` : ''}
        ${location.description ? `<p style="margin: 4px 0;"><strong>描述:</strong> ${location.description}</p>` : ''}
      </div>
    </div>
  `

  const infoWindow = new AMap.InfoWindow({
    content,
    offset: new AMap.Pixel(0, -30)
  })

  infoWindow.open(map, marker.getPosition())
}

const fitView = () => {
  if (!map || markers.length === 0) return

  if (markers.length === 1) {
    const position = markers[0].getPosition()
    map.setZoomAndCenter(15, position)
  } else {
    const bounds = markers.reduce((bounds, marker) => {
      return bounds.extend(marker.getPosition())
    }, new AMap.Bounds())

    const padding = markers.length <= 3 ? [150, 150, 150, 150] : [100, 100, 100, 100]
    map.setBounds(bounds, false, padding)
  }
}

const geocode = async (address: string): Promise<[number, number] | null> => {
  if (!AMap) return null

  return new Promise((resolve) => {
    const geocoder = new AMap.Geocoder()
    geocoder.getLocation(address, (status: string, result: any) => {
      if (status === 'complete' && result.info === 'OK') {
        const { lng, lat } = result.geocodes[0].location
        resolve([lng, lat])
      } else {
        console.error('地理编码失败:', status, result)
        resolve(null)
      }
    })
  })
}

watch(() => props.locations, async (newLocations) => {
  if (!map || !AMap) return
  
  // 检测海外地点
  checkOverseasLocations()
  
  await nextTick()
  addMarkers(newLocations)
  drawRoute(newLocations)
  
  // 仅在有位置数据时才调整视图
  if (newLocations.length > 0) {
    // 使用 setTimeout 确保在地图元素渲染后执行
    setTimeout(() => {
      // fitView()
      map.setZoomAndCenter(getOptimalZoom(), calculateCenter())
    }, 100)
  }
}, { deep: true, immediate: false }) // 改为非立即执行

defineExpose({
  geocode,
  fitView
})

onMounted(() => {
  loadMap()
})
</script>

<style scoped>
.travel-map-container {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 400px;
}

.map-container {
  width: 100%;
  height: 100%;
  border-radius: 8px;
  overflow: hidden;
}

.map-loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  padding: 20px 30px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: #606266;
}

.map-loading .el-icon {
  font-size: 20px;
}

.map-controls {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 1000;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  padding: 4px;
}

.map-controls :deep(.el-button) {
  margin: 0;
}

.overseas-warning {
  position: absolute;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  width: 90%;
  max-width: 500px;
}

.overseas-warning :deep(.el-alert) {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
}

.overseas-warning :deep(.el-alert__description) p {
  margin: 4px 0;
  font-size: 13px;
}
</style>
