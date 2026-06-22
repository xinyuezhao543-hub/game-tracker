<template>
  <div class="page-container">
    <van-nav-bar title="游戏管理" fixed placeholder />

    <div v-if="games.length > 0">
      <div v-for="game in games" :key="game.id" class="card" @click="$router.push(`/games/edit/${game.id}`)">
        <div class="game-row">
          <img v-if="game.icon" :src="game.icon" class="game-icon-large" :alt="game.name" />
          <div v-else class="game-icon-large-placeholder">🎮</div>
          <div class="game-info">
            <div class="game-name">{{ game.name }}</div>
            <div class="game-meta">
              <span :class="game.status === 'abandoned' ? 'badge-abandoned' : 'badge-active'">
                {{ game.status === 'abandoned' ? '已弃坑' : '游玩中' }}
              </span>
              <span class="game-type-badge">{{ typeLabels[game.type] || '其他' }}</span>
              <span class="game-days" v-if="game.startDate">{{ getDaysPlayed(game) }}天</span>
            </div>
          </div>
          <span style="color: var(--text-muted);">›</span>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <div class="empty-state-icon">🎮</div>
      <p>暂无游戏</p>
      <p style="font-size: 13px; margin-top: 8px;">点击右下角 + 添加你在玩的游戏</p>
    </div>

    <button class="fab" @click="$router.push('/games/add')" aria-label="添加游戏">+</button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getGames } from '../utils/storage'

const games = ref([])
const typeLabels = { dress: '换装', card: '卡牌/乙女', other: '其他' }

onMounted(() => {
  games.value = getGames()
})

function getDaysPlayed(game) {
  const start = new Date(game.startDate)
  const end = game.status === 'abandoned' && game.abandonDate ? new Date(game.abandonDate) : new Date()
  return Math.floor((end - start) / (1000 * 60 * 60 * 24))
}
</script>

<style scoped>
.game-row {
  display: flex;
  align-items: center;
  gap: 12px;
}
.game-icon-large-placeholder {
  width: 60px;
  height: 60px;
  border-radius: 14px;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  flex-shrink: 0;
}
.game-info { flex: 1; }
.game-name { font-size: 16px; font-weight: 500; }
.game-meta { display: flex; gap: 8px; align-items: center; margin-top: 6px; flex-wrap: wrap; }
.game-type-badge { font-size: 12px; color: var(--primary-color); background: #e1f5fe; padding: 2px 8px; border-radius: 10px; }
.game-days { font-size: 12px; color: var(--text-muted); }
</style>
