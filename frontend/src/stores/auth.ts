import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '@/api/auth'
import { login, register, getCurrentUser } from '@/api/auth'
import type { RegisterRequest, LoginRequest } from '@/api/auth'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)
  const loading = ref(false)

  // 初始化时从 localStorage 加载用户信息
  const savedToken = localStorage.getItem('auth_token')
  const savedUser = localStorage.getItem('user')
  if (savedToken) {
    token.value = savedToken
  }
  if (savedUser) {
    try {
      user.value = JSON.parse(savedUser)
    } catch (e) {
      console.error('Failed to parse saved user:', e)
    }
  }

  const isAuthenticated = computed(() => !!token.value && !!user.value)

  /**
   * 用户注册
   */
  const registerUser = async (data: RegisterRequest) => {
    loading.value = true
    try {
      const response = await register(data)
      token.value = response.token
      user.value = response.user
      
      // 保存到 localStorage
      localStorage.setItem('auth_token', response.token)
      localStorage.setItem('user', JSON.stringify(response.user))
      
      return response
    } finally {
      loading.value = false
    }
  }

  /**
   * 用户登录
   */
  const loginUser = async (data: LoginRequest) => {
    loading.value = true
    try {
      const response = await login(data)
      token.value = response.token
      user.value = response.user
      
      // 保存到 localStorage
      localStorage.setItem('auth_token', response.token)
      localStorage.setItem('user', JSON.stringify(response.user))
      
      return response
    } finally {
      loading.value = false
    }
  }

  /**
   * 获取当前用户信息
   */
  const fetchCurrentUser = async () => {
    loading.value = true
    try {
      const response = await getCurrentUser()
      user.value = response.user
      
      // 更新 localStorage
      localStorage.setItem('user', JSON.stringify(response.user))
      
      return response.user
    } finally {
      loading.value = false
    }
  }

  /**
   * 用户登出
   */
  const logout = () => {
    user.value = null
    token.value = null
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user')
  }

  return {
    user,
    token,
    loading,
    isAuthenticated,
    registerUser,
    loginUser,
    fetchCurrentUser,
    logout,
  }
})
