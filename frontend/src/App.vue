<script setup lang="ts">
import { RouterView } from 'vue-router'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const handleLogout = () => {
  authStore.logout()
  router.push('/auth')
}

const isAuthPage = () => {
  return route.path === '/auth' || route.path === '/login'
}
</script>

<template>
  <div id="app">
    <!-- 导航栏 -->
    <header v-if="authStore.isAuthenticated && !isAuthPage()" class="app-header">
      <div class="header-container">
        <div class="header-left">
          <router-link to="/" class="logo">
            <span class="logo-icon">✈️</span>
            <span class="logo-text">AI Travel</span>
          </router-link>
          <nav class="main-nav">
            <router-link to="/plans" class="nav-link">我的旅行</router-link>
            <router-link to="/ai-generator" class="nav-link">AI规划</router-link>
          </nav>
        </div>
        <div class="header-right">
          <div class="user-info">
            <span class="user-name">{{ authStore.user?.name || authStore.user?.email }}</span>
            <el-button text @click="handleLogout" class="logout-btn">退出</el-button>
          </div>
        </div>
      </div>
    </header>

    <!-- 主内容 -->
    <main class="app-main" :class="{ 'with-header': authStore.isAuthenticated && !isAuthPage() }">
      <RouterView />
    </main>
  </div>
</template>

<style>
:root {
  --google-blue: #1a73e8;
  --google-blue-hover: #1765cc;
  --google-gray: #5f6368;
  --google-light-gray: #f8f9fa;
  --google-border: #dadce0;
  --google-text: #202124;
  --google-text-secondary: #5f6368;
  --shadow-sm: 0 1px 2px 0 rgba(60,64,67,.3), 0 1px 3px 1px rgba(60,64,67,.15);
  --shadow-md: 0 1px 3px 0 rgba(60,64,67,.3), 0 4px 8px 3px rgba(60,64,67,.15);
  --shadow-lg: 0 4px 6px rgba(0, 0, 0, 0.07), 0 10px 20px rgba(0, 0, 0, 0.1);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body {
  width: 100%;
  height: 100%;
  overflow-x: hidden;
}

body {
  font-family: 'Google Sans', 'Roboto', 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 
    'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
  background-color: #fff;
  color: var(--google-text);
  line-height: 1.6;
}

#app {
  min-height: 100vh;
  width: 100%;
  background-color: #fff;
  box-sizing: border-box;
}

/* 全局 box-sizing */
*, *::before, *::after {
  box-sizing: border-box;
}

/* 头部样式 */
.app-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 64px;
  background: #fff;
  border-bottom: 1px solid var(--google-border);
  z-index: 1000;
  box-shadow: 0 1px 2px rgba(60,64,67,.1);
  width: 100%;
  box-sizing: border-box;
}

.header-container {
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
  height: 100%;
  padding: 0 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-sizing: border-box;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 40px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  font-size: 22px;
  font-weight: 500;
  color: var(--google-text);
  transition: opacity 0.2s;
}

.logo:hover {
  opacity: 0.8;
}

.logo-icon {
  font-size: 28px;
}

.logo-text {
  font-weight: 500;
  letter-spacing: -0.5px;
}

.main-nav {
  display: flex;
  gap: 8px;
}

.nav-link {
  padding: 8px 16px;
  text-decoration: none;
  color: var(--google-text-secondary);
  font-size: 14px;
  font-weight: 500;
  border-radius: 8px;
  transition: all 0.2s;
}

.nav-link:hover {
  background-color: var(--google-light-gray);
  color: var(--google-text);
}

.nav-link.router-link-active {
  color: var(--google-blue);
  background-color: #e8f0fe;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-name {
  font-size: 14px;
  color: var(--google-text-secondary);
  font-weight: 500;
}

.logout-btn {
  color: var(--google-text-secondary);
  font-size: 14px;
  font-weight: 500;
}

.logout-btn:hover {
  color: var(--google-blue);
}

/* 主内容区 */
.app-main {
  min-height: 100vh;
  width: 100%;
  box-sizing: border-box;
}

.app-main.with-header {
  padding-top: 0px;
}

/* Element Plus 样式覆盖 */
.el-button {
  font-family: inherit;
  border-radius: 8px;
  font-weight: 500;
}

.el-button--primary {
  background-color: var(--google-blue);
  border-color: var(--google-blue);
}

.el-button--primary:hover {
  background-color: var(--google-blue-hover);
  border-color: var(--google-blue-hover);
}

.el-card {
  border-radius: 12px;
  border: 1px solid var(--google-border);
  box-shadow: var(--shadow-sm);
  transition: box-shadow 0.3s;
}

.el-card:hover {
  box-shadow: var(--shadow-md);
}

.el-input__wrapper {
  border-radius: 8px;
  box-shadow: none;
  border: 1px solid var(--google-border);
}

.el-input__wrapper:hover {
  border-color: var(--google-text-secondary);
}

.el-input__wrapper.is-focus {
  border-color: var(--google-blue);
  box-shadow: 0 0 0 1px var(--google-blue);
}
</style>
