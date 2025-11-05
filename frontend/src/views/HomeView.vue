<template>
  <div class="home-view">
    <!-- Hero Section -->
    <section class="hero-section">
      <div class="hero-container">
        <h1 class="hero-title">探索世界，从这里开始</h1>
        <p class="hero-subtitle">让 AI 为你规划完美的旅行体验</p>
        <div class="hero-actions">
          <el-button 
            type="primary" 
            size="large" 
            @click="$router.push('/ai-generator')"
            class="cta-button"
          >
            开始 AI 规划
          </el-button>
          <el-button 
            size="large" 
            @click="$router.push('/plans')"
            class="secondary-button"
          >
            查看我的旅行
          </el-button>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="features-section">
      <div class="features-container">
        <h2 class="section-title">为什么选择我们</h2>
        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon">🤖</div>
            <h3>AI 智能规划</h3>
            <p>基于先进的 AI 技术，为你量身定制旅行计划</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">🗺️</div>
            <h3>可视化路线</h3>
            <p>直观的地图展示，让你轻松了解行程安排</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">💰</div>
            <h3>预算优化</h3>
            <p>智能分配预算，让每一分钱都花得值得</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">🎯</div>
            <h3>个性化推荐</h3>
            <p>根据你的偏好，推荐最适合的景点和活动</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Popular Destinations -->
    <section class="destinations-section">
      <div class="destinations-container">
        <h2 class="section-title">热门目的地</h2>
        <div class="destinations-grid">
          <div class="destination-card" @click="startPlan('日本东京')">
            <div class="destination-image" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
              <span class="destination-emoji">🗼</span>
            </div>
            <div class="destination-info">
              <h3>日本东京</h3>
              <p>现代与传统的完美融合</p>
            </div>
          </div>
          <div class="destination-card" @click="startPlan('云南大理')">
            <div class="destination-image" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
              <span class="destination-emoji">🏔️</span>
            </div>
            <div class="destination-info">
              <h3>云南大理</h3>
              <p>风花雪月，诗和远方</p>
            </div>
          </div>
          <div class="destination-card" @click="startPlan('泰国普吉岛')">
            <div class="destination-image" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
              <span class="destination-emoji">🏖️</span>
            </div>
            <div class="destination-info">
              <h3>泰国普吉岛</h3>
              <p>热带海岛的浪漫时光</p>
            </div>
          </div>
          <div class="destination-card" @click="startPlan('法国巴黎')">
            <div class="destination-image" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);">
              <span class="destination-emoji">🗼</span>
            </div>
            <div class="destination-info">
              <h3>法国巴黎</h3>
              <p>艺术与浪漫的代名词</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const startPlan = (destination: string) => {
  router.push({
    path: '/ai-generator',
    query: { destination }
  })
}
</script>

<style scoped>
* {
  box-sizing: border-box;
}

.home-view {
  min-height: calc(100vh - 64px);
  background: #fff;
  width: 100%;
  max-width: 100vw;
  overflow-x: hidden;
}

/* Hero Section */
.hero-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 140px 24px 100px;
  text-align: center;
  box-sizing: border-box;
  width: 100%;
  overflow: hidden;
  margin-top: 64px;
}

.hero-container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 16px;
  box-sizing: border-box;
}

.hero-title {
  font-size: clamp(32px, 5vw, 56px);
  font-weight: 600;
  margin-bottom: 24px;
  line-height: 1.2;
  letter-spacing: -1px;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.hero-subtitle {
  font-size: clamp(16px, 2vw, 20px);
  margin-bottom: 48px;
  opacity: 0.95;
  font-weight: 400;
  word-wrap: break-word;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
}

.hero-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
  padding: 0 16px;
}

.cta-button {
  height: 56px;
  padding: 0 clamp(24px, 4vw, 40px);
  font-size: 16px;
  font-weight: 600;
  background: white;
  color: #667eea;
  border: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  white-space: nowrap;
  min-width: fit-content;
}

.cta-button:hover {
  background: #f8f9fa;
  color: #667eea;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

.secondary-button {
  height: 56px;
  padding: 0 clamp(24px, 4vw, 40px);
  font-size: 16px;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 2px solid white;
  backdrop-filter: blur(10px);
  white-space: nowrap;
  min-width: fit-content;
}

.secondary-button:hover {
  background: rgba(255, 255, 255, 0.3);
  color: white;
  transform: translateY(-2px);
}

/* Features Section */
.features-section {
  padding: 80px 24px;
  background: #f8f9fa;
  width: 100%;
  box-sizing: border-box;
  overflow: hidden;
}

.features-container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 16px;
  box-sizing: border-box;
}

.section-title {
  font-size: clamp(28px, 4vw, 36px);
  font-weight: 600;
  text-align: center;
  margin-bottom: 48px;
  color: var(--google-text);
  word-wrap: break-word;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 32px;
  width: 100%;
}

@media (max-width: 768px) {
  .features-grid {
    grid-template-columns: 1fr;
  }
}

.feature-card {
  background: white;
  padding: 40px 32px;
  border-radius: 16px;
  text-align: center;
  transition: all 0.3s ease;
  border: 1px solid var(--google-border);
  box-shadow: var(--shadow-sm);
}

.feature-card:hover {
  transform: translateY(-8px);
  box-shadow: var(--shadow-lg);
}

.feature-icon {
  font-size: 48px;
  margin-bottom: 20px;
}

.feature-card h3 {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 12px;
  color: var(--google-text);
}

.feature-card p {
  font-size: 14px;
  color: var(--google-text-secondary);
  line-height: 1.6;
}

/* Destinations Section */
.destinations-section {
  padding: 80px 24px;
  background: white;
  width: 100%;
  box-sizing: border-box;
  overflow: hidden;
}

.destinations-container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 16px;
  box-sizing: border-box;
}

.destinations-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  width: 100%;
}

@media (max-width: 768px) {
  .destinations-grid {
    grid-template-columns: 1fr;
  }
}

.destination-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid var(--google-border);
  box-shadow: var(--shadow-sm);
}

.destination-card:hover {
  transform: translateY(-8px);
  box-shadow: var(--shadow-lg);
}

.destination-image {
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.destination-emoji {
  font-size: 80px;
}

.destination-info {
  padding: 24px;
}

.destination-info h3 {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--google-text);
}

.destination-info p {
  font-size: 14px;
  color: var(--google-text-secondary);
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .hero-title {
    font-size: clamp(28px, 4vw, 42px);
  }

  .features-grid,
  .destinations-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .hero-title {
    font-size: 32px;
  }

  .hero-subtitle {
    font-size: 16px;
  }

  .section-title {
    font-size: 24px;
  }

  .hero-section {
    padding: 100px 20px 80px;
  }

  .features-section,
  .destinations-section {
    padding: 60px 20px;
  }

  .features-grid,
  .destinations-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }
}

@media (max-width: 480px) {
  .hero-title {
    font-size: 28px;
  }

  .hero-subtitle {
    font-size: 14px;
  }

  .cta-button,
  .secondary-button {
    width: 100%;
    padding: 0 20px;
  }
}
</style>
