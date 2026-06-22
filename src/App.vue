<template>
  <div class="app">
    <router-view />
    <nav class="tab-bar" v-if="showTabBar">
      <div
        class="tab-item"
        v-for="tab in tabs"
        :key="tab.path"
        :class="{ active: currentTab === tab.path }"
        @click="$router.push(tab.path)"
      >
        <span class="tab-icon">{{ tab.icon }}</span>
        <span class="tab-label">{{ tab.label }}</span>
      </div>
    </nav>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const tabs = [
  { path: '/', icon: '🏠', label: '首页' },
  { path: '/collection', icon: '📚', label: '图鉴' },
  { path: '/calculator', icon: '💎', label: '计算器' },
  { path: '/games', icon: '🎮', label: '游戏' },
  { path: '/settings', icon: '⚙️', label: '设置' },
]

const showTabBar = computed(() => {
  const hiddenRoutes = ['game-add', 'game-edit', 'activity-add', 'activity-edit', 'collection-dress', 'collection-card']
  return !hiddenRoutes.includes(route.name)
})

const currentTab = computed(() => {
  if (route.path === '/') return '/'
  const match = tabs.find(t => t.path !== '/' && route.path.startsWith(t.path))
  return match ? match.path : '/'
})
</script>

<style scoped>
.tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: white;
  display: flex;
  align-items: center;
  justify-content: space-around;
  border-top: 1px solid #eee;
  z-index: 999;
  padding-bottom: env(safe-area-inset-bottom);
}

.tab-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  cursor: pointer;
  padding: 4px 12px;
  border-radius: 8px;
  transition: all 0.2s;
}

.tab-item.active {
  color: var(--primary-color);
}

.tab-item:not(.active) {
  color: var(--text-muted);
}

.tab-icon {
  font-size: 20px;
}

.tab-label {
  font-size: 11px;
}
</style>
