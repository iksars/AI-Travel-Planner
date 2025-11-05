<template>
  <div class="budget-section">
    <div class="section-header">
      <h2 class="section-title">💰 预算与费用</h2>
      <el-button type="primary" @click="showAddExpenseDialog = true">
        <el-icon><Plus /></el-icon>
        记录费用
      </el-button>
    </div>

    <!-- 预算概览 -->
    <div v-if="analysis" class="budget-overview">
      <div class="budget-card">
        <div class="budget-icon">💵</div>
        <div class="budget-content">
          <div class="budget-label">总预算</div>
          <div class="budget-value">¥{{ analysis.totalBudget.toLocaleString() }}</div>
        </div>
      </div>

      <div class="budget-card">
        <div class="budget-icon">💸</div>
        <div class="budget-content">
          <div class="budget-label">已花费</div>
          <div class="budget-value spent">¥{{ analysis.totalSpent.toLocaleString() }}</div>
        </div>
      </div>

      <div class="budget-card">
        <div class="budget-icon">💰</div>
        <div class="budget-content">
          <div class="budget-label">剩余</div>
          <div class="budget-value" :class="{ warning: analysis.remaining < 0 }">
            ¥{{ analysis.remaining.toLocaleString() }}
          </div>
        </div>
      </div>

      <div class="budget-card">
        <div class="budget-icon">📊</div>
        <div class="budget-content">
          <div class="budget-label">使用比例</div>
          <div class="budget-value">{{ analysis.percentageUsed.toFixed(1) }}%</div>
        </div>
      </div>
    </div>

    <!-- 预算进度条 -->
    <div v-if="analysis" class="budget-progress">
      <el-progress
        :percentage="Math.min(analysis.percentageUsed, 100)"
        :status="analysis.percentageUsed > 100 ? 'exception' : analysis.percentageUsed > 80 ? 'warning' : 'success'"
        :stroke-width="20"
      />
    </div>

    <!-- 图表区域 -->
    <div v-if="analysis && analysis.categoryBreakdown.length > 0" class="charts-section">
      <el-row :gutter="24">
        <el-col :xs="24" :md="12">
          <div class="chart-card">
            <h3 class="chart-title">分类占比</h3>
            <v-chart :option="pieChartOption" style="height: 300px;" />
          </div>
        </el-col>
        <el-col :xs="24" :md="12">
          <div class="chart-card">
            <h3 class="chart-title">每日消费趋势</h3>
            <v-chart :option="lineChartOption" style="height: 300px;" />
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 费用列表 -->
    <div v-if="analysis && analysis.recentExpenses.length > 0" class="expenses-list">
      <h3 class="subsection-title">最近费用记录</h3>
      <div class="expense-items">
        <div 
          v-for="expense in analysis.recentExpenses"
          :key="expense.id"
          class="expense-item"
        >
          <div class="expense-icon">{{ getCategoryIcon(expense.category) }}</div>
          <div class="expense-details">
            <div class="expense-category">{{ expense.category }}</div>
            <div class="expense-desc">{{ expense.description || '无描述' }}</div>
            <div class="expense-date">{{ formatDate(expense.date) }}</div>
          </div>
          <div class="expense-amount">¥{{ expense.amount.toLocaleString() }}</div>
          <div class="expense-actions">
            <el-button size="small" text @click="editExpense(expense)">
              <el-icon><Edit /></el-icon>
            </el-button>
            <el-button size="small" text type="danger" @click="handleDeleteExpense(expense.id)">
              <el-icon><Delete /></el-icon>
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <el-empty
      v-if="!loading && (!analysis || analysis.recentExpenses.length === 0)"
      description="还没有费用记录"
      :image-size="120"
    >
      <el-button type="primary" @click="showAddExpenseDialog = true">添加第一笔费用</el-button>
    </el-empty>

    <!-- 添加/编辑费用对话框 -->
    <el-dialog
      v-model="showAddExpenseDialog"
      :title="editingExpense ? '编辑费用' : '添加费用'"
      width="500px"
      append-to-body
      destroy-on-close
      :lock-scroll="false"
      :modal-append-to-body="true"
    >
      <el-form :model="expenseForm" label-width="80px">
        <el-form-item label="分类">
          <el-select v-model="expenseForm.category" placeholder="请选择分类" style="width: 100%">
            <el-option
              v-for="cat in EXPENSE_CATEGORIES"
              :key="cat.value"
              :label="`${cat.icon} ${cat.label}`"
              :value="cat.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="金额">
          <el-input-number
            v-model="expenseForm.amount"
            :min="0"
            :precision="2"
            :controls="false"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="日期">
          <el-date-picker
            v-model="expenseForm.date"
            type="date"
            placeholder="选择日期"
            style="width: 100%"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="expenseForm.description"
            type="textarea"
            :rows="3"
            placeholder="费用描述（可选）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddExpenseDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSaveExpense" :loading="saving">
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { PieChart, LineChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
} from 'echarts/components'
import type { BudgetAnalysis, Expense, CreateExpenseInput, UpdateExpenseInput } from '@/api/expenses'
import {
  getBudgetAnalysis,
  createExpense,
  updateExpense,
  deleteExpense,
  EXPENSE_CATEGORIES,
  getCategoryIcon,
} from '@/api/expenses'

// 注册 ECharts 组件
use([
  CanvasRenderer,
  PieChart,
  LineChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
])

const props = defineProps<{
  travelPlanId: string
}>()

const emit = defineEmits<{
  (e: 'refresh'): void
}>()

const analysis = ref<BudgetAnalysis | null>(null)
const loading = ref(false)
const showAddExpenseDialog = ref(false)
const editingExpense = ref<Expense | null>(null)
const saving = ref(false)

const expenseForm = ref({
  category: '',
  amount: 0,
  date: new Date().toISOString().split('T')[0],
  description: '',
})

// 加载预算分析数据
const loadAnalysis = async () => {
  loading.value = true
  try {
    const response = await getBudgetAnalysis(props.travelPlanId)
    analysis.value = response.analysis
  } catch (error) {
    console.error('Failed to load budget analysis:', error)
    ElMessage.error('加载预算分析失败')
  } finally {
    loading.value = false
  }
}

// 饼图配置
const pieChartOption = computed(() => {
  if (!analysis.value) return {}

  return {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: ¥{c} ({d}%)',
    },
    legend: {
      bottom: 10,
      left: 'center',
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: false,
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold',
          },
        },
        data: analysis.value.categoryBreakdown.map((item) => ({
          name: `${getCategoryIcon(item.category)} ${item.category}`,
          value: item.totalAmount,
        })),
      },
    ],
  }
})

// 折线图配置
const lineChartOption = computed(() => {
  if (!analysis.value) return {}

  return {
    tooltip: {
      trigger: 'axis',
      formatter: '{b}: ¥{c}',
    },
    xAxis: {
      type: 'category',
      data: analysis.value.dailySpending.map((item) => 
        new Date(item.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
      ),
      boundaryGap: false,
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: '¥{value}',
      },
    },
    grid: {
      left: '10%',
      right: '5%',
      bottom: '10%',
      top: '10%',
    },
    series: [
      {
        type: 'line',
        data: analysis.value.dailySpending.map((item) => item.amount),
        smooth: true,
        areaStyle: {
          opacity: 0.3,
        },
        lineStyle: {
          width: 3,
        },
      },
    ],
  }
})

// 编辑费用
const editExpense = (expense: Expense) => {
  editingExpense.value = expense
  expenseForm.value = {
    category: expense.category,
    amount: expense.amount,
    date: expense.date.split('T')[0],
    description: expense.description || '',
  }
  showAddExpenseDialog.value = true
}

// 保存费用
const handleSaveExpense = async () => {
  if (!expenseForm.value.category || !expenseForm.value.amount) {
    ElMessage.warning('请填写分类和金额')
    return
  }

  saving.value = true
  try {
    if (editingExpense.value) {
      // 更新
      const updateData: UpdateExpenseInput = {
        category: expenseForm.value.category,
        amount: expenseForm.value.amount,
        date: expenseForm.value.date,
        description: expenseForm.value.description || undefined,
      }
      await updateExpense(editingExpense.value.id, updateData)
      ElMessage.success('费用已更新')
    } else {
      // 创建
      const createData: CreateExpenseInput = {
        travelPlanId: props.travelPlanId,
        category: expenseForm.value.category,
        amount: expenseForm.value.amount,
        date: expenseForm.value.date,
        description: expenseForm.value.description || undefined,
      }
      await createExpense(createData)
      ElMessage.success('费用已添加')
    }

    showAddExpenseDialog.value = false
    editingExpense.value = null
    resetForm()
    await loadAnalysis()
    emit('refresh')
  } catch (error) {
    console.error('Failed to save expense:', error)
    ElMessage.error('保存费用失败')
  } finally {
    saving.value = false
  }
}

// 删除费用
const handleDeleteExpense = async (id: string) => {
  try {
    await ElMessageBox.confirm('确定要删除这条费用记录吗？', '确认删除', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    })

    await deleteExpense(id)
    ElMessage.success('费用已删除')
    await loadAnalysis()
    emit('refresh')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Failed to delete expense:', error)
      ElMessage.error('删除费用失败')
    }
  }
}

// 重置表单
const resetForm = () => {
  expenseForm.value = {
    category: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    description: '',
  }
}

// 格式化日期
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 监听对话框关闭
watch(showAddExpenseDialog, (val) => {
  if (!val) {
    editingExpense.value = null
    resetForm()
  }
})

onMounted(() => {
  loadAnalysis()
})

// 暴露刷新方法
defineExpose({
  loadAnalysis,
})
</script>

<style scoped>
.budget-section {
  background: white;
  padding: 32px;
  border-radius: 20px;
  border: 1px solid var(--google-border);
  box-shadow: var(--shadow-sm);
  overflow: hidden; /* 隐藏溢出内容 */
  max-height: 1200px; /* 设置最大高度,保持与右侧时间线计算一致 */
  display: flex;
  flex-direction: column;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  position: relative;
  background: white;
  flex-shrink: 0; /* 防止标题被压缩 */
}

.section-title {
  font-size: 22px;
  font-weight: 600;
  color: var(--google-text);
  margin: 0;
}

/* 预算概览 */
.budget-overview {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 24px;
  flex-shrink: 0; /* 防止被压缩 */
}

.budget-card {
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  padding: 20px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  border: 1px solid var(--google-border);
  transition: all 0.3s;
}

.budget-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.budget-icon {
  font-size: 32px;
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 12px;
  box-shadow: var(--shadow-sm);
}

.budget-content {
  flex: 1;
}

.budget-label {
  font-size: 13px;
  color: var(--google-text-secondary);
  margin-bottom: 4px;
}

.budget-value {
  font-size: 20px;
  font-weight: 600;
  color: var(--google-text);
}

.budget-value.spent {
  color: #f56c6c;
}

.budget-value.warning {
  color: #e6a23c;
}

/* 进度条 */
.budget-progress {
  margin-bottom: 32px;
  flex-shrink: 0; /* 防止被压缩 */
}

/* 图表区域 */
.charts-section {
  margin-bottom: 32px;
  flex-shrink: 0; /* 防止被压缩 */
}

.chart-card {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 16px;
  border: 1px solid var(--google-border);
}

.chart-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--google-text);
  margin: 0 0 16px 0;
}

/* 费用列表 */
.expenses-list {
  margin-top: 32px;
  flex: 1; /* 占据剩余空间 */
  min-height: 0; /* 允许缩小 */
  display: flex;
  flex-direction: column;
  overflow: hidden; /* 防止溢出 */
}

.subsection-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--google-text);
  margin-bottom: 16px;
  flex-shrink: 0; /* 标题不压缩 */
}

.expense-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1; /* 占据剩余空间 */
  overflow-y: auto; /* 启用滚动 */
  overflow-x: hidden;
  padding-right: 4px; /* 为滚动条留出空间 */
}

/* 自定义费用列表滚动条 */
.expense-items::-webkit-scrollbar {
  width: 6px;
}

.expense-items::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

.expense-items::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 10px;
}

.expense-items::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

.expense-item {
  display: flex;
  align-items: center;
  gap: 16px;
  background: #f8f9fa;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid var(--google-border);
  transition: all 0.3s;
}

.expense-item:hover {
  background: #ffffff;
  box-shadow: var(--shadow-sm);
}

.expense-icon {
  font-size: 28px;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 10px;
}

.expense-details {
  flex: 1;
}

.expense-category {
  font-size: 16px;
  font-weight: 600;
  color: var(--google-text);
  margin-bottom: 4px;
}

.expense-desc {
  font-size: 14px;
  color: var(--google-text-secondary);
  margin-bottom: 2px;
}

.expense-date {
  font-size: 12px;
  color: var(--google-text-secondary);
}

.expense-amount {
  font-size: 20px;
  font-weight: 600;
  color: var(--google-blue);
}

.expense-actions {
  display: flex;
  gap: 4px;
}

/* 响应式 */
@media (max-width: 1400px) {
  .budget-section {
    max-height: none; /* 单列布局时取消高度限制 */
    overflow: visible;
  }
  
  .expenses-list {
    overflow: visible;
  }
  
  .expense-items {
    max-height: none;
    overflow-y: visible;
  }
}

@media (max-width: 1024px) {
  .budget-overview {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .budget-section {
    padding: 20px;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .budget-overview {
    grid-template-columns: 1fr;
  }
}
</style>
