<template>
  <div class="plans-view">
    <div class="plans-container">
      <!-- 页面标题 -->
      <div class="page-header">
        <div class="header-content">
          <h1 class="page-title">我的旅行</h1>
          <p class="page-subtitle">管理和查看你的所有旅行计划</p>
        </div>
        <div class="header-actions">
          <el-button 
            type="primary" 
            size="large"
            @click="$router.push('/ai-generator')"
            class="primary-action"
          >
            <el-icon><MagicStick /></el-icon>
            AI 智能规划
          </el-button>
          <el-button 
            size="large"
            @click="showCreateDialog = true"
            class="secondary-action"
          >
            <el-icon><Plus /></el-icon>
            手动创建
          </el-button>
        </div>
      </div>

      <!-- 过滤器 -->
      <div class="filter-section">
        <el-radio-group v-model="statusFilter" @change="fetchPlans" class="status-filter">
          <el-radio-button label="">全部</el-radio-button>
          <el-radio-button label="draft">草稿</el-radio-button>
          <el-radio-button label="ongoing">进行中</el-radio-button>
          <el-radio-button label="completed">已完成</el-radio-button>
        </el-radio-group>
      </div>

      <!-- 旅行计划列表 -->
      <div v-loading="loading" class="plans-grid">
        <div 
          v-for="plan in plans" 
          :key="plan.id" 
          class="plan-card"
          @click="viewPlan(plan.id)"
        >
          <div class="plan-card-image">
            <div class="plan-card-overlay">
              <span class="destination-icon">📍</span>
            </div>
            <el-tag :type="getStatusType(plan.status)" class="status-tag">
              {{ getStatusText(plan.status) }}
            </el-tag>
          </div>
          
          <div class="plan-card-content">
            <h3 class="plan-title">{{ plan.title }}</h3>
            <p class="plan-destination">
              <el-icon><Location /></el-icon>
              {{ plan.destination }}
            </p>
            
            <div class="plan-details">
              <div class="plan-detail-item">
                <el-icon><Calendar /></el-icon>
                <span>{{ formatDateRange(plan.startDate, plan.endDate) }}</span>
              </div>
              <div class="plan-detail-item">
                <el-icon><User /></el-icon>
                <span>{{ plan.peopleCount }} 人</span>
              </div>
              <div class="plan-detail-item">
                <el-icon><Money /></el-icon>
                <span>¥{{ formatNumber(plan.budget) }}</span>
              </div>
            </div>
          </div>

          <div class="plan-card-actions">
            <el-button size="small" text @click.stop="editPlan(plan)">
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
            <el-button size="small" text type="danger" @click.stop="confirmDelete(plan.id)">
              <el-icon><Delete /></el-icon>
              删除
            </el-button>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="!loading && plans.length === 0" class="empty-state">
          <div class="empty-icon">✈️</div>
          <h3>还没有旅行计划</h3>
          <p>开始规划你的第一次旅行吧！</p>
          <el-button type="primary" @click="$router.push('/ai-generator')">
            创建计划
          </el-button>
        </div>
      </div>
    </div>

    <!-- 创建/编辑对话框 -->
    <el-dialog
      v-model="showCreateDialog"
      :title="editingPlan ? '编辑旅行计划' : '创建旅行计划'"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form ref="planFormRef" :model="planForm" :rules="planRules" label-position="top">
        <el-form-item label="标题" prop="title">
          <el-input 
            v-model="planForm.title" 
            placeholder="给你的旅行起个名字" 
            size="large"
          />
        </el-form-item>

        <el-form-item label="目的地" prop="destination">
          <el-input 
            v-model="planForm.destination" 
            placeholder="你想去哪里？" 
            size="large"
          />
        </el-form-item>

        <el-form-item label="日期范围" prop="dateRange">
          <el-date-picker
            v-model="planForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 100%"
            size="large"
          />
        </el-form-item>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="预算" prop="budget">
              <el-input 
                v-model.number="planForm.budget" 
                type="number" 
                placeholder="总预算"
                size="large"
              >
                <template #prepend>¥</template>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="人数" prop="peopleCount">
              <el-input-number 
                v-model="planForm.peopleCount" 
                :min="1" 
                :max="99" 
                style="width: 100%"
                size="large"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showCreateDialog = false" size="large">取消</el-button>
          <el-button type="primary" :loading="saving" @click="handleSavePlan" size="large">
            {{ editingPlan ? '保存' : '创建' }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import type { TravelPlan, CreateTravelPlanRequest, UpdateTravelPlanRequest } from '@/api/travelPlans'
import { getTravelPlans, createTravelPlan, updateTravelPlan, deleteTravelPlan } from '@/api/travelPlans'

const router = useRouter()
const authStore = useAuthStore()

const plans = ref<TravelPlan[]>([])
const loading = ref(false)
const saving = ref(false)
const statusFilter = ref('')
const showCreateDialog = ref(false)
const editingPlan = ref<TravelPlan | null>(null)
const planFormRef = ref<FormInstance>()

const planForm = reactive({
  title: '',
  destination: '',
  dateRange: [] as Date[],
  budget: 0,
  peopleCount: 1,
})

const planRules: FormRules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  destination: [{ required: true, message: '请输入目的地', trigger: 'blur' }],
  dateRange: [{ required: true, message: '请选择日期范围', trigger: 'change' }],
  budget: [
    { required: true, message: '请输入预算', trigger: 'blur' },
    { type: 'number', min: 0, message: '预算必须大于0', trigger: 'blur' },
  ],
  peopleCount: [
    { required: true, message: '请输入人数', trigger: 'blur' },
    { type: 'number', min: 1, message: '人数必须大于0', trigger: 'blur' },
  ],
}

onMounted(() => {
  fetchPlans()
})

const fetchPlans = async () => {
  loading.value = true
  try {
    const response = await getTravelPlans(statusFilter.value || undefined)
    plans.value = response.travelPlans
  } catch (error) {
    console.error('Failed to fetch plans:', error)
  } finally {
    loading.value = false
  }
}

const viewPlan = (id: string) => {
  router.push(`/plans/${id}`)
}

const editPlan = (plan: TravelPlan) => {
  editingPlan.value = plan
  planForm.title = plan.title
  planForm.destination = plan.destination
  planForm.dateRange = [new Date(plan.startDate), new Date(plan.endDate)]
  planForm.budget = plan.budget
  planForm.peopleCount = plan.peopleCount
  showCreateDialog.value = true
}

const handleSavePlan = async () => {
  if (!planFormRef.value) return

  await planFormRef.value.validate(async (valid) => {
    if (!valid) return

    saving.value = true
    try {
      const data = {
        title: planForm.title,
        destination: planForm.destination,
        startDate: planForm.dateRange[0].toISOString(),
        endDate: planForm.dateRange[1].toISOString(),
        budget: planForm.budget,
        peopleCount: planForm.peopleCount,
      }

      if (editingPlan.value) {
        await updateTravelPlan(editingPlan.value.id, data as UpdateTravelPlanRequest)
        ElMessage.success('更新成功！')
      } else {
        await createTravelPlan(data as CreateTravelPlanRequest)
        ElMessage.success('创建成功！')
      }

      showCreateDialog.value = false
      resetForm()
      fetchPlans()
    } catch (error) {
      console.error('Failed to save plan:', error)
    } finally {
      saving.value = false
    }
  })
}

const confirmDelete = async (id: string) => {
  try {
    await ElMessageBox.confirm('确定要删除这个旅行计划吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })

    await deleteTravelPlan(id)
    ElMessage.success('删除成功！')
    fetchPlans()
  } catch (error) {
    // 用户取消删除
  }
}

const resetForm = () => {
  editingPlan.value = null
  planForm.title = ''
  planForm.destination = ''
  planForm.dateRange = []
  planForm.budget = 0
  planForm.peopleCount = 1
  planFormRef.value?.resetFields()
}

const getStatusType = (status: string) => {
  const types: Record<string, any> = {
    draft: 'info',
    ongoing: '',
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

const formatDateRange = (start: string, end: string) => {
  const startDate = new Date(start)
  const endDate = new Date(end)
  return `${startDate.getMonth() + 1}月${startDate.getDate()}日 - ${endDate.getMonth() + 1}月${endDate.getDate()}日`
}

const formatNumber = (num: number) => {
  return num.toLocaleString()
}
</script>

<style scoped>
.plans-view {
  min-height: calc(100vh - 64px);
  background: #f8f9fa;
  padding: 40px 24px;
  margin-top: 64px;
  box-sizing: border-box;
  width: 100%;
  overflow-x: hidden;
}

.plans-container {
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
}

/* 页面标题 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 32px;
  flex-wrap: wrap;
  gap: 24px;
}

.header-content {
  flex: 1;
}

.page-title {
  font-size: 32px;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--google-text);
}

.page-subtitle {
  font-size: 16px;
  color: var(--google-text-secondary);
}

.header-actions {
  display: flex;
  gap: 12px;
}

.primary-action,
.secondary-action {
  height: 48px;
  padding: 0 24px;
  font-weight: 500;
}

/* 过滤器 */
.filter-section {
  margin-bottom: 32px;
}

.status-filter {
  background: white;
  border-radius: 12px;
  padding: 4px;
  box-shadow: var(--shadow-sm);
}

/* 计划网格 */
.plans-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  min-height: 400px;
}

.plan-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid var(--google-border);
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
}

.plan-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.plan-card-image {
  height: 160px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.plan-card-overlay {
  font-size: 64px;
}

.status-tag {
  position: absolute;
  top: 12px;
  right: 12px;
  border: none;
  font-weight: 500;
}

.plan-card-content {
  padding: 20px;
  flex: 1;
}

.plan-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 12px;
  color: var(--google-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.plan-destination {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 15px;
  color: var(--google-text-secondary);
  margin-bottom: 16px;
}

.plan-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.plan-detail-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--google-text-secondary);
}

.plan-card-actions {
  padding: 12px 20px;
  border-top: 1px solid var(--google-border);
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

/* 空状态 */
.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 80px 20px;
}

.empty-icon {
  font-size: 80px;
  margin-bottom: 24px;
  opacity: 0.5;
}

.empty-state h3 {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 12px;
  color: var(--google-text);
}

.empty-state p {
  font-size: 16px;
  color: var(--google-text-secondary);
  margin-bottom: 24px;
}

/* 对话框 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 响应式 */
@media (max-width: 1200px) {
  .plans-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .plans-view {
    padding: 24px 16px;
  }

  .page-header {
    flex-direction: column;
  }

  .header-actions {
    width: 100%;
  }

  .primary-action,
  .secondary-action {
    flex: 1;
  }

  .plans-grid {
    grid-template-columns: 1fr;
  }
}
</style>
