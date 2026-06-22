<template>
  <div class="page-container">
    <van-nav-bar title="图鉴收集" fixed placeholder />

    <van-tabs v-model:active="activeTab" sticky offset-top="46">
      <van-tab title="换装">
        <div v-if="dressGames.length > 0">
          <div
            v-for="game in dressGames"
            :key="game.id"
            class="card"
            @click="$router.push(`/collection/dress/${game.id}`)"
          >
            <div class="collection-game-row">
              <img v-if="game.icon" :src="game.icon" class="game-icon" :alt="game.name" />
              <div v-else class="game-icon-placeholder">👗</div>
              <div class="collection-game-info">
                <div class="collection-game-name">{{ game.name }}</div>
                <div class="collection-game-stats">
                  {{ getDressStats(game.id) }}
                </div>
              </div>
              <span style="color: var(--text-muted);">›</span>
            </div>
          </div>
        </div>
        <div v-else class="empty-state">
          <div class="empty-state-icon">👗</div>
          <p>暂无换装游戏</p>
          <p style="font-size: 13px; margin-top: 8px;">请先在"游戏"页面添加换装类型的游戏</p>
        </div>
      </van-tab>

      <van-tab title="卡牌/乙女">
        <div v-if="cardGames.length > 0">
          <div
            v-for="game in cardGames"
            :key="game.id"
            class="card"
            @click="$router.push(`/collection/card/${game.id}`)"
          >
            <div class="collection-game-row">
              <img v-if="game.icon" :src="game.icon" class="game-icon" :alt="game.name" />
              <div v-else class="game-icon-placeholder">🃏</div>
              <div class="collection-game-info">
                <div class="collection-game-name">{{ game.name }}</div>
                <div class="collection-game-stats">
                  {{ getCardStats(game.id) }}
                </div>
              </div>
              <span style="color: var(--text-muted);">›</span>
            </div>
          </div>
        </div>
        <div v-else class="empty-state">
          <div class="empty-state-icon">🃏</div>
          <p>暂无卡牌/乙女游戏</p>
          <p style="font-size: 13px; margin-top: 8px;">请先在"游戏"页面添加卡牌类型的游戏</p>
        </div>
      </van-tab>
    </van-tabs>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getGames, getDressCollections, getCardCollections } from '../utils/storage'

const activeTab = ref(0)
const games = ref([])
const dressCollections = ref([])
const cardCollections = ref([])

onMounted(() => {
  games.value = getGames()
  dressCollections.value = getDressCollections()
  cardCollections.value = getCardCollections()
})

const dressGames = ref([])
const cardGames = ref([])

onMounted(() => {
  dressGames.value = games.value.filter(g => g.type === 'dress')
  cardGames.value = games.value.filter(g => g.type === 'card')
})

function getDressStats(gameId) {
  const collections = dressCollections.value.filter(c => c.gameId === gameId)
  if (collections.length === 0) return '暂无收集记录'
  const total = collections.reduce((sum, c) => sum + (c.parts?.length || 0), 0)
  const obtained = collections.reduce((sum, c) => sum + (c.parts?.filter(p => p.obtained)?.length || 0), 0)
  return `${collections.length}个卡池 · ${obtained}/${total}件`
}

function getCardStats(gameId) {
  const collections = cardCollections.value.filter(c => c.gameId === gameId)
  if (collections.length === 0) return '暂无收集记录'
  const total = collections.reduce((sum, c) => sum + (c.cards?.length || 0), 0)
  const obtained = collections.reduce((sum, c) => sum + (c.cards?.filter(p => p.obtained)?.length || 0), 0)
  return `${collections.length}个活动 · ${obtained}/${total}张`
}
</script>

<style scoped>
.collection-game-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.game-icon-placeholder {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}

.collection-game-info {
  flex: 1;
}

.collection-game-name {
  font-size: 15px;
  font-weight: 500;
}

.collection-game-stats {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 4px;
}
</style>
