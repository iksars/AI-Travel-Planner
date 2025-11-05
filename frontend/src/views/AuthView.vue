<template>
  <div class="auth-view">
    <div class="auth-container">
      <!-- Logo 和标题 -->
      <div class="auth-header">
        <div class="auth-logo">
          <span class="logo-icon">✈️</span>
          <span class="logo-text">AI Travel</span>
        </div>
        <h1 class="auth-title">{{ isLogin ? '欢迎回来' : '开始你的旅程' }}</h1>
        <p class="auth-subtitle">{{ isLogin ? '登录到你的账户' : '创建新账户来探索世界' }}</p>
      </div>

      <!-- 表单卡片 -->
      <div class="auth-card">
        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-position="top"
          @submit.prevent="handleSubmit"
        >
          <el-form-item v-if="!isLogin" label="姓名" prop="name">
            <el-input 
              v-model="form.name" 
              placeholder="请输入姓名（可选）" 
              size="large"
            >
              <template #prefix>
                <el-icon><User /></el-icon>
              </template>
            </el-input>
          </el-form-item>

          <el-form-item label="邮箱" prop="email">
            <el-input 
              v-model="form.email" 
              type="email" 
              placeholder="请输入邮箱"
              size="large"
            >
              <template #prefix>
                <el-icon><Message /></el-icon>
              </template>
            </el-input>
          </el-form-item>

          <el-form-item label="密码" prop="password">
            <el-input
              v-model="form.password"
              type="password"
              placeholder="请输入密码"
              show-password
              size="large"
            >
              <template #prefix>
                <el-icon><Lock /></el-icon>
              </template>
            </el-input>
          </el-form-item>

          <el-form-item v-if="!isLogin" label="确认密码" prop="confirmPassword">
            <el-input
              v-model="form.confirmPassword"
              type="password"
              placeholder="请再次输入密码"
              show-password
              size="large"
            >
              <template #prefix>
                <el-icon><Lock /></el-icon>
              </template>
            </el-input>
          </el-form-item>

          <el-form-item>
            <el-button
              type="primary"
              size="large"
              :loading="loading"
              @click="handleSubmit"
              class="submit-button"
            >
              {{ isLogin ? '登录' : '注册' }}
            </el-button>
          </el-form-item>

          <div class="switch-mode">
            <span v-if="isLogin">
              还没有账号？
              <el-button text type="primary" @click="toggleMode" class="switch-link">
                立即注册
              </el-button>
            </span>
            <span v-else>
              已有账号？
              <el-button text type="primary" @click="toggleMode" class="switch-link">
                去登录
              </el-button>
            </span>
          </div>
        </el-form>
      </div>

      <!-- 底部装饰 -->
      <div class="auth-footer">
        <p>安全可靠的 AI 旅行规划助手</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'

const router = useRouter()
const authStore = useAuthStore()

const isLogin = ref(true)
const formRef = ref<FormInstance>()
const loading = computed(() => authStore.loading)

const form = reactive({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
})

const validateConfirmPassword = (rule: any, value: any, callback: any) => {
  if (value !== form.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const rules: FormRules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少6位', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' },
  ],
}

const toggleMode = () => {
  isLogin.value = !isLogin.value
  formRef.value?.resetFields()
}

const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    try {
      if (isLogin.value) {
        await authStore.loginUser({
          email: form.email,
          password: form.password,
        })
        ElMessage.success('登录成功！')
      } else {
        await authStore.registerUser({
          email: form.email,
          password: form.password,
          name: form.name || undefined,
        })
        ElMessage.success('注册成功！')
      }
      router.push('/plans')
    } catch (error: any) {
      console.error('Authentication error:', error)
    }
  })
}
</script>

<style scoped>
.auth-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px 20px;
}

.auth-container {
  width: 100%;
  max-width: 480px;
}

.auth-header {
  text-align: center;
  margin-bottom: 40px;
  color: white;
}

.auth-logo {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
  font-size: 28px;
  font-weight: 600;
}

.logo-icon {
  font-size: 36px;
}

.logo-text {
  letter-spacing: -0.5px;
}

.auth-title {
  font-size: 36px;
  font-weight: 600;
  margin-bottom: 12px;
  letter-spacing: -1px;
}

.auth-subtitle {
  font-size: 16px;
  opacity: 0.9;
  margin: 0;
}

.auth-card {
  background: white;
  border-radius: 24px;
  padding: 48px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.submit-button {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  margin-top: 8px;
}

.switch-mode {
  text-align: center;
  margin-top: 24px;
  color: var(--google-text-secondary);
  font-size: 14px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 4px;
}

.switch-link {
  font-size: 14px;
  font-weight: 600;
  padding: 0 4px;
}

.auth-footer {
  text-align: center;
  margin-top: 32px;
  color: white;
  opacity: 0.8;
}

.auth-footer p {
  margin: 0;
  font-size: 14px;
}

/* 响应式 */
@media (max-width: 768px) {
  .auth-view {
    padding: 24px 16px;
  }

  .auth-title {
    font-size: 28px;
  }

  .auth-subtitle {
    font-size: 14px;
  }

  .auth-card {
    padding: 32px 24px;
    border-radius: 16px;
  }
}
</style>
