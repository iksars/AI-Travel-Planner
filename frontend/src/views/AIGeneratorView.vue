<template>
  <div class="ai-generator-view">
    <div class="generator-container">
      <div class="generator-header">
        <h1 class="generator-title">AI 智能旅行规划</h1>
        <p class="generator-subtitle">告诉我你的想法，让 AI 为你打造完美的旅行体验</p>
      </div>

      <div class="generator-content">
        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-position="top"
          :disabled="generating"
          class="generator-form"
        >
          <div class="form-section">
            <el-form-item label="📍 目的地" prop="destination">
              <div class="input-with-voice">
                <el-input
                  v-model="form.destination"
                  placeholder="例如：日本东京、云南大理、泰国普吉岛"
                  size="large"
                  class="large-input"
                >
                  <template #prefix>
                    <el-icon><Location /></el-icon>
                  </template>
                </el-input>
                <VoiceInput :disabled="generating" @recognized="handleVoiceRecognition" />
              </div>
            </el-form-item>

            <el-row :gutter="16">
              <el-col :span="12">
                <el-form-item label="📅 出发日期" prop="startDate">
                  <el-date-picker
                    v-model="form.startDate"
                    type="date"
                    placeholder="选择出发日期"
                    style="width: 100%"
                    size="large"
                    :disabled-date="disabledDate"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="⏱️ 旅行天数" prop="days">
                  <el-input-number
                    v-model="form.days"
                    :min="1"
                    :max="30"
                    size="large"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="16">
              <el-col :span="12">
                <el-form-item label="💰 总预算" prop="budget">
                  <el-input
                    v-model.number="form.budget"
                    type="number"
                    placeholder="预算金额"
                    size="large"
                  >
                    <template #prefix>¥</template>
                  </el-input>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="👥 人数" prop="peopleCount">
                  <el-input-number
                    v-model="form.peopleCount"
                    :min="1"
                    :max="99"
                    size="large"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <div class="form-section">
            <el-form-item label="🎯 旅行偏好（可多选）">
              <div class="preferences-grid">
                <el-checkbox-group v-model="form.preferences">
                  <el-checkbox label="自然风光" class="preference-checkbox">
                    <span class="preference-icon">🏞️</span>
                    <span>自然风光</span>
                  </el-checkbox>
                  <el-checkbox label="历史文化" class="preference-checkbox">
                    <span class="preference-icon">🏛️</span>
                    <span>历史文化</span>
                  </el-checkbox>
                  <el-checkbox label="美食探索" class="preference-checkbox">
                    <span class="preference-icon">🍜</span>
                    <span>美食探索</span>
                  </el-checkbox>
                  <el-checkbox label="购物休闲" class="preference-checkbox">
                    <span class="preference-icon">🛍️</span>
                    <span>购物休闲</span>
                  </el-checkbox>
                  <el-checkbox label="冒险刺激" class="preference-checkbox">
                    <span class="preference-icon">🎢</span>
                    <span>冒险刺激</span>
                  </el-checkbox>
                  <el-checkbox label="亲子活动" class="preference-checkbox">
                    <span class="preference-icon">👨‍👩‍👧</span>
                    <span>亲子活动</span>
                  </el-checkbox>
                  <el-checkbox label="摄影打卡" class="preference-checkbox">
                    <span class="preference-icon">📷</span>
                    <span>摄影打卡</span>
                  </el-checkbox>
                  <el-checkbox label="休闲度假" class="preference-checkbox">
                    <span class="preference-icon">🏖️</span>
                    <span>休闲度假</span>
                  </el-checkbox>
                </el-checkbox-group>
              </div>
            </el-form-item>
          </div>

          <div class="form-section">
            <el-form-item label="📝 其他要求（可选）">
              <el-input
                v-model="form.otherRequirements"
                type="textarea"
                :rows="4"
                placeholder="例如：想住特色民宿、需要无障碍设施、想体验当地生活、对海鲜过敏等..."
              />
            </el-form-item>
          </div>

          <el-form-item>
            <el-button
              type="primary"
              size="large"
              :loading="generating"
              :disabled="generating || !isApiKeyConfigured"
              @click="handleGenerate"
              class="generate-button"
            >
              <el-icon v-if="!generating"><MagicStick /></el-icon>
              {{ generating ? '正在生成中...' : '开始生成我的专属计划' }}
            </el-button>
            <el-alert
              v-if="!isApiKeyConfigured"
              title="提示：需要配置 AI API Key 才能使用 AI 功能"
              type="warning"
              :closable="false"
              style="margin-top: 12px"
            />
          </el-form-item>
        </el-form>

        <!-- 生成进度 -->
        <div v-if="generating" class="progress-section">
          <div class="progress-icon">
            <el-icon class="is-loading" :size="48"><Loading /></el-icon>
          </div>
          <p class="progress-text">{{ progressText }}</p>
          <el-progress :percentage="progress" :show-text="false" class="progress-bar" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, reactive, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import {
  Location,
  MagicStick,
  Loading,
} from '@element-plus/icons-vue'
import { generateItinerary, type AIGenerateRequest } from '@/api/ai';
import VoiceInput from '@/components/VoiceInput.vue';

const router = useRouter()
const route = useRoute()
const formRef = ref<FormInstance>()
const generating = ref(false)
const progress = ref(0)
const progressText = ref('')

const isApiKeyConfigured = computed(() => true)

const form = reactive({
  destination: '',
  startDate: null as Date | null,
  days: 3,
  budget: 5000,
  peopleCount: 2,
  preferences: [] as string[],
  otherRequirements: '',
})

const handleVoiceRecognition = (data: { text?: string; plan?: any }) => {
  const { text, plan } = data
  if (plan) {
    // 遍历 plan 对象，只更新非空字段
    for (const key in plan) {
      const value = plan[key]
      if (value !== null && value !== undefined && Object.prototype.hasOwnProperty.call(form, key)) {
        if (key === 'startDate') {
          form.startDate = new Date(value)
        } else {
          // @ts-ignore
          form[key] = value
        }
      }
    }
    // 如果 plan 中没有 destination，但有 text，则使用 text
    if (!plan.destination && text) {
      form.destination = text
    }
  } else if (text) {
    form.destination = text
  }
}

const rules: FormRules = {
  destination: [{ required: true, message: '请输入目的地', trigger: 'blur' }],
  startDate: [{ required: true, message: '请选择出发日期', trigger: 'change' }],
  days: [
    { required: true, message: '请输入旅行天数', trigger: 'blur' },
    { type: 'number', min: 1, max: 30, message: '旅行天数应在 1-30 天之间', trigger: 'blur' },
  ],
  budget: [
    { required: true, message: '请输入预算', trigger: 'blur' },
    { type: 'number', min: 100, message: '预算至少100元', trigger: 'blur' },
  ],
  peopleCount: [
    { required: true, message: '请输入人数', trigger: 'blur' },
    { type: 'number', min: 1, message: '人数至少1人', trigger: 'blur' },
  ],
}

onMounted(() => {
  // 如果从首页带参数过来，自动填充目的地
  if (route.query.destination) {
    form.destination = route.query.destination as string
  }
})

const disabledDate = (time: Date) => {
  return time.getTime() < Date.now() - 8.64e7
}

const handleGenerate = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    generating.value = true
    progress.value = 0

    try {
      const progressInterval = setInterval(() => {
        if (progress.value < 90) {
          progress.value += Math.random() * 15
          updateProgressText()
        }
      }, 800)

      const data: AIGenerateRequest = {
        destination: form.destination,
        startDate: form.startDate!.toISOString().split('T')[0],
        days: form.days,
        budget: form.budget,
        peopleCount: form.peopleCount,
        preferences: form.preferences,
        otherRequirements: form.otherRequirements || undefined,
      }

      const response = await generateItinerary(data)

      clearInterval(progressInterval)
      progress.value = 100
      progressText.value = '生成完成！'

      ElMessage.success('🎉 AI 已为您生成专属旅行计划！')

      setTimeout(() => {
        router.push(`/plans/${response.travelPlan.id}`)
      }, 1000)
    } catch (error: any) {
      console.error('Generation error:', error)
    } finally {
      generating.value = false
    }
  })
}

const updateProgressText = () => {
  const texts = [
    '🤔 正在分析您的旅行需求...',
    '🌏 正在搜索最佳目的地信息...',
    '🗺️ 正在规划最优旅行路线...',
    '🏨 正在寻找合适的住宿...',
    '🍽️ 正在挑选特色美食...',
    '🎯 正在优化行程安排...',
    '✨ 正在添加精彩活动...',
  ]
  const index = Math.floor((progress.value / 100) * texts.length)
  progressText.value = texts[Math.min(index, texts.length - 1)]
}
</script>

<style scoped>
/* 语音输入按钮样式优化 */
/* 目的地输入框右侧悬浮语音按钮 */
/* 宽屏下目的地输入框铺满父容器 */
.input-with-voice {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
}
.input-with-voice .el-input {
  flex: 1 1 auto;
  width: 100%;
}

.ai-generator-view {
  min-height: calc(100vh - 64px);
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 60px 24px;
  margin-top: 64px;
  box-sizing: border-box;
  width: 100%;
  overflow-x: hidden;
}

.generator-container {
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
}

.generator-header {
  text-align: center;
  margin-bottom: 48px;
  color: white;
}

.generator-title {
  font-size: 48px;
  font-weight: 600;
  margin-bottom: 16px;
  letter-spacing: -1px;
}

.generator-subtitle {
  font-size: 18px;
  opacity: 0.95;
}

.generator-content {
  background: white;
  border-radius: 24px;
  padding: 48px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.generator-form {
  max-width: 100%;
}

.form-section {
  margin-bottom: 32px;
  padding-bottom: 32px;
  border-bottom: 1px solid var(--google-border);
}

.form-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.large-input :deep(.el-input__inner) {
  font-size: 16px;
}

/* 旅行偏好横向展开，宽屏一行显示所有选项 */
.preferences-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
.preference-checkbox {
  flex: 0 1 22%;
  min-width: 180px;
  max-width: 220px;
}

.preference-checkbox {
  margin: 0 !important;
  padding: 12px 16px;
  border: 2px solid var(--google-border);
  border-radius: 12px;
  transition: all 0.2s;
  background: white;
}

.preference-checkbox:hover {
  border-color: var(--google-blue);
  background: #f8f9fa;
}

.preference-checkbox :deep(.el-checkbox__input.is-checked + .el-checkbox__label) {
  color: var(--google-blue);
}

.preference-checkbox :deep(.el-checkbox__input.is-checked) ~ .el-checkbox__label .preference-icon {
  transform: scale(1.2);
}

.preference-icon {
  font-size: 20px;
  margin-right: 6px;
  display: inline-block;
  transition: transform 0.2s;
}

.generate-button {
  width: 100%;
  height: 56px;
  font-size: 18px;
  font-weight: 600;
  margin-top: 16px;
  border-radius: 12px;
}

.progress-section {
  margin-top: 32px;
  padding: 32px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 16px;
  text-align: center;
}

.progress-icon {
  margin-bottom: 16px;
  color: var(--google-blue);
}

.progress-text {
  font-size: 18px;
  font-weight: 500;
  color: var(--google-text);
  margin-bottom: 16px;
}

.progress-bar {
  max-width: 400px;
  margin: 0 auto;
}

/* 响应式 */
@media (max-width: 1024px) {
  .input-with-voice {
    width: 100%;
  }
  .preferences-grid {
    flex-wrap: wrap;
    gap: 10px;
  }
  .preference-checkbox {
    flex: 0 1 32%;
    min-width: 120px;
    max-width: 180px;
  }
}

@media (max-width: 768px) {
  .ai-generator-view {
    padding: 32px 16px;
  }
  .generator-title {
    font-size: 32px;
  }
  .generator-subtitle {
    font-size: 16px;
  }
  .generator-content {
    padding: 32px 24px;
    border-radius: 16px;
  }
  .input-with-voice {
    width: 100%;
  }
  .preferences-grid {
    flex-wrap: wrap;
    gap: 8px;
  }
  .preference-checkbox {
    flex: 0 1 48%;
    min-width: 100px;
    max-width: 140px;
  }
}

@media (max-width: 480px) {
  .input-with-voice {
    width: 100%;
  }
  .preferences-grid {
    flex-direction: column;
    gap: 6px;
  }
  .preference-checkbox {
    flex: 1 1 100%;
    min-width: 80px;
    max-width: 100%;
  }
}
</style>
