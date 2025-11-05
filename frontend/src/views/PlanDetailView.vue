<template>
  <div class="plan-detail-view">
    <div v-loading="loading" class="detail-container">
      <!-- 返回按钮 -->
      <div class="back-section">
        <el-button text @click="$router.back()" class="back-button">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
      </div>

      <template v-if="plan">
        <!-- 计划标题卡片 -->
        <div class="plan-hero">
          <div class="hero-gradient"></div>
          <div class="hero-content">
            <div class="hero-left">
              <h1 class="hero-title">{{ plan.title }}</h1>
              <div class="hero-meta">
                <el-tag :type="getStatusType(plan.status)" size="large" class="status-tag">
                  {{ getStatusText(plan.status) }}
                </el-tag>
              </div>
            </div>
            <!-- 基本信息卡片集成到 Hero 区域 -->
            <div class="hero-info-cards">
              <div class="hero-info-item">
                <div class="hero-info-icon">📍</div>
                <div class="hero-info-text">
                  <div class="hero-info-label">目的地</div>
                  <div class="hero-info-value">{{ plan.destination }}</div>
                </div>
              </div>
              <div class="hero-info-item">
                <div class="hero-info-icon">📅</div>
                <div class="hero-info-text">
                  <div class="hero-info-label">日期</div>
                  <div class="hero-info-value">{{ formatDate(plan.startDate) }} - {{ formatDate(plan.endDate) }}</div>
                </div>
              </div>
              <div class="hero-info-item">
                <div class="hero-info-icon">👥</div>
                <div class="hero-info-text">
                  <div class="hero-info-label">人数</div>
                  <div class="hero-info-value">{{ plan.peopleCount }} 人</div>
                </div>
              </div>
              <div class="hero-info-item">
                <div class="hero-info-icon">💰</div>
                <div class="hero-info-text">
                  <div class="hero-info-label">预算</div>
                  <div class="hero-info-value">¥{{ plan.budget.toLocaleString() }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 主要内容区域：左右分栏布局 -->
        <div class="main-content-layout">
          <!-- 左侧：地图和预算 -->
          <div class="left-column">
            <!-- 地图可视化 -->
            <div v-if="plan && mapLocations.length > 0" class="map-section">
              <div class="section-header">
                <h2 class="section-title">🗺️ 行程路线图</h2>
                <div class="view-switcher">
                  <el-button-group>
                    <el-button 
                      :type="viewMode === 'all' ? 'primary' : ''"
                      size="small"
                      @click="viewMode = 'all'"
                    >
                      全部
                    </el-button>
                    <el-button 
                      v-for="day in totalDays"
                      :key="day"
                      :type="viewMode === day ? 'primary' : ''"
                      size="small"
                      @click="viewMode = day"
                    >
                      D{{ day }}
                    </el-button>
                  </el-button-group>
                </div>
              </div>
              
              <div class="map-container">
                <TravelMap
                  :locations="filteredLocations"
                  :center="mapCenter"
                  :zoom="13"
                  style="height: 600px; border-radius: 16px; overflow: hidden;"
                />
              </div>
              
              <div class="map-legend">
                <div class="legend-item">
                  <span class="legend-dot" style="background-color: #FF6B6B;"></span>
                  <span>景点</span>
                </div>
                <div class="legend-item">
                  <span class="legend-dot" style="background-color: #4ECDC4;"></span>
                  <span>酒店</span>
                </div>
                <div class="legend-item">
                  <span class="legend-dot" style="background-color: #FFD93D;"></span>
                  <span>餐厅</span>
                </div>
                <div class="legend-item">
                  <span class="legend-dot" style="background-color: #95E1D3;"></span>
                  <span>交通</span>
                </div>
              </div>
            </div>

            <!-- 预算与费用分析 -->
            <BudgetAnalysis v-if="plan" :travel-plan-id="plan.id" @refresh="fetchPlan(plan.id)" />
          </div>

          <!-- 右侧：每日行程 -->
          <div class="right-column">
            <!-- 每日行程 -->
            <div v-if="plan && plan.itineraries && plan.itineraries.length > 0" class="itinerary-section">
              <h2 class="section-title">📅 每日行程安排</h2>
              
              <div class="timeline">
            <div
              v-for="(itinerary, index) in plan.itineraries"
              :key="itinerary.id"
              class="timeline-item"
            >
              <div class="timeline-marker">
                <div class="timeline-dot">{{ index + 1 }}</div>
                <div v-if="index < plan.itineraries.length - 1" class="timeline-line"></div>
              </div>
              
              <div class="timeline-content">
                <div class="day-card">
                  <div class="day-header">
                    <h3 class="day-title">第 {{ itinerary.day }} 天</h3>
                    <span class="day-date">{{ formatDate(itinerary.date) }}</span>
                    <el-button type="primary" size="small" @click="openEditDialog(index)">编辑</el-button>
                  </div>

                  <!-- 活动安排 -->
                  <div v-if="itinerary.activities" class="activities-section">
                    <h4 class="subsection-title">📍 活动安排</h4>
                    <div class="activities-list">
                      <div 
                        v-for="(activity, actIdx) in parseJSON(itinerary.activities)" 
                        :key="actIdx"
                        class="activity-item"
                      >
                        <div class="activity-header">
                          <el-tag size="small" class="activity-time">{{ activity.time }}</el-tag>
                          <h5 class="activity-name">{{ activity.name }}</h5>
                        </div>
                        <div class="activity-location">📍 {{ activity.location }}</div>
                        <p class="activity-desc">{{ activity.description }}</p>
                      </div>
                    </div>
                  </div>
                  <!-- 编辑弹窗 -->
                  <el-dialog v-model="editDialogVisible" title="编辑每日行程" width="600px">
                    <div v-if="editItinerary">
                      <el-form :model="editItinerary">
                        <el-form-item label="日期">
                          <el-date-picker v-model="editItinerary.date" type="date" style="width:100%" />
                        </el-form-item>
                        <el-form-item label="活动安排">
                          <draggable v-model="editItinerary.activities" item-key="name" :animation="200">
                            <template #item="{element, index}">
                              <div class="edit-activity-row">
                                <el-input v-model="element.time" placeholder="时间" style="width:80px;margin-right:8px;" />
                                <el-input v-model="element.name" placeholder="活动名称" style="width:200px;margin-right:8px;" />
                                <el-input v-model="element.location" placeholder="地点" style="width:120px;margin-right:8px;" />
                                <el-input v-model="element.description" placeholder="描述" style="width:180px;margin-right:8px;" />
                                <el-button type="danger" icon="el-icon-delete" @click="removeActivity(index)" circle />
                              </div>
                            </template>
                          </draggable>
                          <el-button type="success" @click="addActivity" style="margin-top:8px;">添加活动</el-button>
                        </el-form-item>
                      </el-form>
                    </div>
                    <template #footer>
                      <el-button @click="editDialogVisible = false">取消</el-button>
                      <el-button type="primary" @click="saveItineraryEdit">保存</el-button>
                    </template>
                  </el-dialog>

                  <!-- 住宿、餐饮、交通 -->
                  <div class="day-details">
                    <div v-if="itinerary.accommodation" class="detail-item">
                      <div class="detail-icon">🏨</div>
                      <div class="detail-content">
                        <div class="detail-label">住宿</div>
                        <template v-if="parseJSON(itinerary.accommodation)">
                          <div class="detail-value">{{ parseJSON(itinerary.accommodation)?.name }}</div>
                          <div class="detail-sub">{{ parseJSON(itinerary.accommodation)?.location }}</div>
                        </template>
                      </div>
                    </div>

                    <div v-if="itinerary.transportation" class="detail-item">
                      <div class="detail-icon">🚗</div>
                      <div class="detail-content">
                        <div class="detail-label">交通</div>
                        <div class="detail-value">{{ itinerary.transportation }}</div>
                      </div>
                    </div>

                    <div v-if="itinerary.restaurants" class="detail-item">
                      <div class="detail-icon">🍽️</div>
                      <div class="detail-content">
                        <div class="detail-label">用餐</div>
                        <div 
                          v-for="(restaurant, rIdx) in parseJSON(itinerary.restaurants)" 
                          :key="rIdx"
                          class="detail-value"
                        >
                          {{ restaurant.name }} <span class="cuisine-tag">{{ restaurant.cuisine }}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- 备注 -->
                  <div v-if="itinerary.notes" class="notes-section">
                    <div class="notes-icon">💡</div>
                    <div class="notes-content">
                      <strong>温馨提示：</strong>
                      <p>{{ itinerary.notes }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
            </div>
          </div>
        </div>
      </template>

      <el-empty v-if="!plan && !loading" description="未找到该旅行计划" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import type { TravelPlan } from '@/api/travelPlans'
import { getTravelPlan } from '@/api/travelPlans'
import TravelMap from '@/components/TravelMap.vue'
import BudgetAnalysis from '@/components/BudgetAnalysis.vue'
import draggable from 'vuedraggable'
import { ElMessage } from 'element-plus'

const editDialogVisible = ref(false)
const editItinerary = ref<any>(null)
let editIndex = -1

function openEditDialog(index: number) {
  editIndex = index
  // 深拷贝，避免直接修改原数据
  editItinerary.value = JSON.parse(JSON.stringify(plan.value?.itineraries[index]))
  // 活动解析为对象数组
  if (typeof editItinerary.value.activities === 'string') {
    try {
      editItinerary.value.activities = JSON.parse(editItinerary.value.activities)
    } catch {
      editItinerary.value.activities = []
    }
  }
  editDialogVisible.value = true
}

function addActivity() {
  if (editItinerary.value && Array.isArray(editItinerary.value.activities)) {
    editItinerary.value.activities.push({ time: '', name: '', location: '', description: '' })
  }
}

function removeActivity(idx: number) {
  if (editItinerary.value && Array.isArray(editItinerary.value.activities)) {
    editItinerary.value.activities.splice(idx, 1)
  }
}

async function saveItineraryEdit() {
  if (editItinerary.value && editIndex >= 0 && plan.value) {
    // 保存到原计划（前端本地更新）
    plan.value.itineraries[editIndex] = {
      ...editItinerary.value,
      activities: JSON.stringify(editItinerary.value.activities)
    }
    editDialogVisible.value = false
    ElMessage.success('行程已更新')
    // 后端持久化
    try {
      await fetch(`/api/travel-plans/${plan.value.id}/itinerary/${editItinerary.value.day}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editItinerary.value,
          activities: editItinerary.value.activities
        })
      })
    } catch (e) {
      ElMessage.error('后端保存失败')
    }
  }
}

interface MapLocation {
  name: string
  type: 'attraction' | 'hotel' | 'restaurant' | 'transport'
  coordinates?: [number, number]
  address?: string
  description?: string
  time?: string
  day?: number
}

const route = useRoute()
const plan = ref<TravelPlan | null>(null)
const loading = ref(false)
const viewMode = ref<'all' | number>('all')

// 从行程中提取所有位置信息
const mapLocations = computed<MapLocation[]>(() => {
  if (!plan.value?.itineraries) return []

  const locations: MapLocation[] = []

  plan.value.itineraries.forEach((itinerary) => {
    // 提取活动地点
    const activities = parseJSON(itinerary.activities) as any[]
    if (activities) {
      activities.forEach((activity) => {
        if (activity.coordinates?.lat && activity.coordinates?.lng) {
          locations.push({
            name: activity.name,
            type: activity.type === 'attraction' ? 'attraction' : 'transport',
            coordinates: [activity.coordinates.lng, activity.coordinates.lat],
            address: activity.location,
            description: activity.description,
            time: activity.time,
            day: itinerary.day
          })
        }
      })
    }

    // 提取住宿信息
    const accommodation = parseJSON(itinerary.accommodation) as any
    if (accommodation?.coordinates?.lat && accommodation?.coordinates?.lng) {
      locations.push({
        name: accommodation.name,
        type: 'hotel',
        coordinates: [accommodation.coordinates.lng, accommodation.coordinates.lat],
        address: accommodation.location,
        description: accommodation.type,
        day: itinerary.day
      })
    }

    // 提取餐厅信息
    const restaurants = parseJSON(itinerary.restaurants) as any[]
    if (restaurants) {
      restaurants.forEach((restaurant) => {
        if (restaurant.coordinates?.lat && restaurant.coordinates?.lng) {
          locations.push({
            name: restaurant.name,
            type: 'restaurant',
            coordinates: [restaurant.coordinates.lng, restaurant.coordinates.lat],
            address: restaurant.location,
            description: restaurant.cuisine,
            day: itinerary.day
          })
        }
      })
    }
  })

  return locations
})

// 根据视图模式过滤位置
const filteredLocations = computed(() => {
  if (viewMode.value === 'all') {
    return mapLocations.value
  }
  return mapLocations.value.filter(loc => loc.day === viewMode.value)
})

// 计算地图中心点
const mapCenter = computed<[number, number]>(() => {
  const locs = filteredLocations.value
  if (locs.length === 0) {
    return [116.397428, 39.90923] // 默认北京
  }

  const avgLng = locs.reduce((sum, loc) => sum + (loc.coordinates?.[0] || 0), 0) / locs.length
  const avgLat = locs.reduce((sum, loc) => sum + (loc.coordinates?.[1] || 0), 0) / locs.length

  return [avgLng, avgLat]
})

// 总天数
const totalDays = computed(() => {
  return plan.value?.itineraries?.length || 0
})

onMounted(async () => {
  const id = route.params.id as string
  if (id) {
    await fetchPlan(id)
  }
})

const fetchPlan = async (id: string) => {
  loading.value = true
  try {
    const response = await getTravelPlan(id)
    plan.value = response.travelPlan
  } catch (error) {
    console.error('Failed to fetch plan:', error)
  } finally {
    loading.value = false
  }
}

const getStatusType = (status: string) => {
  const types: Record<string, any> = {
    draft: 'info',
    ongoing: 'warning',
    completed: 'success',
  }
  return types[status] || 'info'
}

const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    draft: '草稿',
    ongoing: '进行中',
    completed: '已完成',
  }
  return texts[status] || status
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
}

const formatDateTime = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN')
}

const parseJSON = (jsonString: string | null) => {
  if (!jsonString) return null
  try {
    return JSON.parse(jsonString)
  } catch {
    return null
  }
}
</script>

<style scoped>
.plan-detail-view {
  min-height: calc(100vh - 64px);
  background: #f8f9fa;
  margin-top: 64px;
  box-sizing: border-box;
  width: 100%;
  overflow-x: hidden;
}

.detail-container {
  width: 100%;
  max-width: 1600px; /* 增加最大宽度以充分利用宽屏 */
  margin: 0 auto;
  padding: 24px;
}

/* 返回按钮 */
.back-section {
  margin-bottom: 16px;
}

.back-button {
  font-size: 15px;
  color: var(--google-text-secondary);
  padding: 8px 12px;
}

.back-button:hover {
  color: var(--google-blue);
}

/* Hero 区域 - 优化为横向布局 */
.plan-hero {
  position: relative;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 24px;
  padding: 48px;
  margin-bottom: 32px;
  overflow: hidden;
  box-shadow: var(--shadow-lg);
}

.hero-gradient {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.9) 0%, rgba(118, 75, 162, 0.9) 100%);
}

.hero-content {
  position: relative;
  z-index: 1;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 48px;
  flex-wrap: wrap;
}

.hero-left {
  flex: 0 0 auto;
}

.hero-title {
  font-size: 38px;
  font-weight: 600;
  margin-bottom: 16px;
  letter-spacing: -1px;
}

.hero-meta {
  display: flex;
  align-items: center;
  gap: 16px;
}

.status-tag {
  font-size: 14px;
  font-weight: 600;
  padding: 8px 16px;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
}

/* Hero 信息卡片 */
.hero-info-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  flex: 1;
  min-width: 600px;
}

.hero-info-item {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.3s;
}

.hero-info-item:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: translateY(-2px);
}

.hero-info-icon {
  font-size: 28px;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
}

.hero-info-text {
  flex: 1;
  min-width: 0;
}

.hero-info-label {
  font-size: 12px;
  opacity: 0.9;
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.hero-info-value {
  font-size: 16px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 主要内容区域 - 左右分栏 */
.main-content-layout {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr; /* 左侧更宽，给地图更多空间 */
  gap: 32px;
  margin-bottom: 32px;
  align-items: start; /* 顶部对齐 */
}

.left-column,
.right-column {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.left-column {
  position: sticky;
  top: 88px;
  align-self: start; /* 从顶部开始 */
}

.right-column {
  /* 右侧高度 = 左侧地图高度(650px) + 间隙(32px) + 预算组件最大高度(约1200px) */
  max-height: calc(650px + 32px + 1200px); /* 总计约1882px */
  min-height: 650px; /* 至少和地图一样高 */
}

/* 地图区域 */
.map-section {
  background: white;
  padding: 32px;
  border-radius: 20px;
  border: 1px solid var(--google-border);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 650px; /* 确保地图有足够的高度 */
  flex-shrink: 0; /* 不被压缩 */
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.section-title {
  font-size: 22px;
  font-weight: 600;
  color: var(--google-text);
  margin: 0;
}

.view-switcher {
  display: flex;
  gap: 8px;
}

.map-container {
  margin-bottom: 20px;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid var(--google-border);
}

.map-legend {
  display: flex;
  justify-content: center;
  gap: 32px;
  flex-wrap: wrap;
  padding-top: 20px;
  border-top: 1px solid var(--google-border);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--google-text-secondary);
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  display: inline-block;
}

/* 行程时间线 */
.itinerary-section {
  background: white;
  padding: 32px;
  padding-bottom: 16px; /* 减少底部内边距，为滚动条腾出空间 */
  border-radius: 20px;
  border: 1px solid var(--google-border);
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  max-height: 100%; /* 占满右侧列的高度 */
  overflow: hidden; /* 隐藏溢出 */
}

.itinerary-section .section-title {
  flex-shrink: 0; /* 标题不参与滚动 */
  margin-bottom: 16px;
}

.timeline {
  flex: 1;
  overflow-y: auto; /* 内容区域可滚动 */
  overflow-x: hidden;
  padding-right: 8px; /* 为滚动条留出空间 */
  margin-right: -8px;
}

/* 自定义滚动条样式 */
.timeline::-webkit-scrollbar {
  width: 6px;
}

.timeline::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

.timeline::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 10px;
}

.timeline::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

.timeline-item {
  display: flex;
  gap: 24px;
  position: relative;
}

.timeline-item:not(:last-child) {
  margin-bottom: 32px;
}

.timeline-marker {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
}

.timeline-dot {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--google-blue);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(26, 115, 232, 0.3);
}

.timeline-line {
  width: 2px;
  flex: 1;
  background: linear-gradient(to bottom, var(--google-blue) 0%, var(--google-border) 100%);
  margin-top: 8px;
  min-height: 60px;
}

.timeline-content {
  flex: 1;
  padding-bottom: 16px;
}

.day-card {
  background: #f8f9fa;
  border-radius: 16px;
  padding: 28px;
  border: 1px solid var(--google-border);
}

.day-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid var(--google-border);
}

.day-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--google-text);
  margin: 0;
}

.day-date {
  font-size: 15px;
  color: var(--google-text-secondary);
  font-weight: 500;
}

/* 活动区域 */
.activities-section {
  margin-bottom: 24px;
}

.subsection-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--google-text);
  margin-bottom: 16px;
}

.activities-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.activity-item {
  background: white;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid var(--google-border);
}

.activity-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.activity-time {
  background: var(--google-blue);
  color: white;
  border: none;
  font-weight: 600;
}

.activity-name {
  font-size: 18px;
  font-weight: 600;
  color: var(--google-text);
  margin: 0;
}

.activity-location {
  font-size: 14px;
  color: var(--google-text-secondary);
  margin-bottom: 8px;
}

.activity-desc {
  font-size: 14px;
  color: var(--google-text);
  line-height: 1.6;
  margin: 0;
}

/* 详情区域 */
.day-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.detail-item {
  background: white;
  padding: 16px;
  border-radius: 12px;
  display: flex;
  gap: 12px;
  border: 1px solid var(--google-border);
}

.detail-icon {
  font-size: 24px;
}

.detail-content {
  flex: 1;
}

.detail-label {
  font-size: 12px;
  color: var(--google-text-secondary);
  margin-bottom: 4px;
  font-weight: 600;
  text-transform: uppercase;
}

.detail-value {
  font-size: 14px;
  color: var(--google-text);
  font-weight: 500;
  margin-bottom: 2px;
}

.detail-sub {
  font-size: 13px;
  color: var(--google-text-secondary);
}

.cuisine-tag {
  font-size: 12px;
  color: var(--google-text-secondary);
  margin-left: 4px;
}

/* 备注区域 */
.notes-section {
  background: linear-gradient(135deg, #fff3cd 0%, #fff8dc 100%);
  padding: 16px 20px;
  border-radius: 12px;
  display: flex;
  gap: 12px;
  border: 1px solid #ffc107;
}

.notes-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.notes-content {
  flex: 1;
}

.notes-content strong {
  display: block;
  margin-bottom: 6px;
  color: var(--google-text);
  font-size: 14px;
}

.notes-content p {
  margin: 0;
  color: var(--google-text);
  font-size: 14px;
  line-height: 1.6;
}

/* 响应式 */
@media (max-width: 1024px) {
  .info-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* 响应式 */
@media (max-width: 1400px) {
  .main-content-layout {
    grid-template-columns: 1fr; /* 在较窄屏幕上改为单列 */
  }
  
  .left-column,
  .right-column {
    max-height: none; /* 单列布局时取消高度限制 */
    min-height: auto;
  }
  
  .left-column {
    position: relative; /* 取消粘性定位 */
    top: 0;
  }
  
  .map-section {
    max-height: none; /* 单列时取消高度限制 */
  }
  
  .hero-info-cards {
    grid-template-columns: repeat(2, 1fr);
    min-width: auto;
  }
  
  .itinerary-section {
    max-height: none; /* 单列时取消高度限制 */
  }
  
  .timeline {
    overflow-y: visible; /* 单列时不需要滚动 */
  }
}

@media (max-width: 1024px) {
  .detail-container {
    max-width: 100%;
  }
  
  .hero-content {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .hero-info-cards {
    width: 100%;
  }
}

@media (max-width: 768px) {
  .detail-container {
    padding: 16px;
  }

  .plan-hero {
    padding: 32px 20px;
    border-radius: 16px;
  }

  .hero-title {
    font-size: 28px;
  }
  
  .hero-info-cards {
    grid-template-columns: 1fr;
  }
  
  .hero-info-item {
    padding: 16px;
  }

  .map-section,
  .itinerary-section {
    padding: 20px;
    border-radius: 16px;
  }

  .section-title {
    font-size: 20px;
  }

  .timeline-item {
    gap: 16px;
  }

  .timeline-dot {
    width: 40px;
    height: 40px;
    font-size: 16px;
  }

  .day-card {
    padding: 20px;
  }

  .day-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .day-details {
    grid-template-columns: 1fr;
  }
}
</style>
