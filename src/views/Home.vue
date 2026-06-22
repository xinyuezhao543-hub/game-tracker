<template>
  <div class="page-container">
    <van-nav-bar title="活动倒计时" fixed placeholder />

    <!-- 活动列表 -->
    <div v-if="sortedActivities.length > 0">
      <div
        v-for="activity in sortedActivities"
        :key="activity.id"
        class="card"
        :class="{ 'card-urgent': isUrgent(activity) }"
        @click="editActivity(activity)"
      >
        <div class="activity-row">
          <img
            v-if="getGame(activity.gameId)?.icon"
            :src="getGame(activity.gameId).icon"
            class="game-icon"
            :alt="getGame(activity.gameId)?.name"
          />
          <div v-else class="game-icon-placeholder">🎮</div>
          <div class="activity-info">
            <div class="activity-name">{{ activity.name }}</div>
            <div class="activity-game">{{ getGame(activity.gameId)?.name || '未知游戏' }}</div>
          </div>
          <div class="countdown-text" :class="isUrgent(activity) ? 'countdown-urgent' : 'countdown-normal'">
            {{ getCountdown(activity) }}
          </div>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <div class="empty-state-icon">📅</div>
      <p>暂无进行中的活动</p>
      <p style="font-size: 13px; margin-top: 8px;">点击右下角 + 添加活动</p>
    </div>

    <!-- 日历区域 -->
    <div class="calendar-section">
      <div class="section-title">📆 活动日历</div>
      <van-calendar
        :poppable="false"
        :show-confirm="false"
        :style="{ height: '400px' }"
        :min-date="calendarMinDate"
        :max-date="calendarMaxDate"
        @select="onCalendarSelect"
        :formatter="calendarFormatter"
        color="#4fc3f7"
      />
    </div>

    <!-- 选中日期的活动 -->
    <van-popup v-model:show="showDateActivities" position="bottom" round :style="{ maxHeight: '60%' }">
      <div class="date-activities-popup">
        <div class="popup-title">{{ selectedDateStr }} 的活动</div>
        <div v-if="dateActivities.length > 0">
          <div v-for="activity in dateActivities" :key="activity.id" class="card">
            <div class="activity-row">
              <img
                v-if="getGame(activity.gameId)?.icon"
                :src="getGame(activity.gameId).icon"
                class="game-icon"
                :alt="getGame(activity.gameId)?.name"
              />
              <div v-else class="game-icon-placeholder">🎮</div>
              <div class="activity-info">
                <div class="activity-name">{{ activity.name }}</div>
                <div class="activity-game">{{ getGame(activity.gameId)?.name }}</div>
                <div class="activity-date-range">
                  {{ formatDate(activity.startDate) }} ~ {{ formatDate(activity.endDate) }}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="empty-state" style="padding: 30px;">
          <p>当天没有活动</p>
        </div>
      </div>
    </van-popup>

    <!-- 添加按钮 -->
    <button class="fab" @click="$router.push('/activity/add')" aria-label="添加活动">+</button>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getActivities, getGames } from '../utils/storage'

const router = useRouter()
const activities = ref([])
const games = ref([])
const showDateActivities = ref(false)
const selectedDate = ref(null)

const now = ref(new Date())

onMounted(() => {
  loadData()
  // 每分钟刷新倒计时
  setInterval(() => {
    now.value = new Date()
  }, 60000)
})

function loadData() {
  activities.value = getActivities()
  games.value = getGames()
}

function getGame(gameId) {
  return games.value.find(g => g.id === gameId)
}

// 只显示未结束的活动
const activeActivities = computed(() => {
  return activities.value.filter(a => new Date(a.endDate) > now.value)
})

// 排序：48小时内的置顶，其余按结束时间升序
const sortedActivities = computed(() => {
  const list = [...activeActivities.value]
  list.sort((a, b) => {
    const aUrgent = isUrgent(a)
    const bUrgent = isUrgent(b)
    if (aUrgent && !bUrgent) return -1
    if (!aUrgent && bUrgent) return 1
    return new Date(a.endDate) - new Date(b.endDate)
  })
  return list
})

function isUrgent(activity) {
  const diff = new Date(activity.endDate) - now.value
  return diff > 0 && diff <= 48 * 60 * 60 * 1000
}

function getCountdown(activity) {
  const diff = new Date(activity.endDate) - now.value
  if (diff <= 0) return '已结束'
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  if (days > 0) return `${days}天${hours}小时`
  if (hours > 0) return `${hours}小时${minutes}分`
  return `${minutes}分钟`
}

function editActivity(activity) {
  router.push(`/activity/edit/${activity.id}`)
}

// 日历相关
const calendarMinDate = computed(() => {
  const d = new Date()
  d.setMonth(d.getMonth() - 1)
  return d
})

const calendarMaxDate = computed(() => {
  const d = new Date()
  d.setMonth(d.getMonth() + 2)
  return d
})

function calendarFormatter(day) {
  const dateStr = formatDateKey(day.date)
  const hasActivity = activities.value.some(a => {
    const start = formatDateKey(new Date(a.startDate))
    const end = formatDateKey(new Date(a.endDate))
    return dateStr >= start && dateStr <= end
  })
  if (hasActivity) {
    day.bottomInfo = '●'
  }
  return day
}

function onCalendarSelect(date) {
  selectedDate.value = date
  showDateActivities.value = true
}

const selectedDateStr = computed(() => {
  if (!selectedDate.value) return ''
  return formatDate(selectedDate.value)
})

const dateActivities = computed(() => {
  if (!selectedDate.value) return []
  const dateStr = formatDateKey(selectedDate.value)
  return activities.value.filter(a => {
    const start = formatDateKey(new Date(a.startDate))
    const end = formatDateKey(new Date(a.endDate))
    return dateStr >= start && dateStr <= end
  })
})

function formatDate(date) {
  const d = new Date(date)
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

function formatDateKey(date) {
  const d = new Date(date)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
</script>

<style scoped>
.activity-row {
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

.activity-info {
  flex: 1;
  min-width: 0;
}

.activity-name {
  font-size: 15px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.activity-game {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 2px;
}

.activity-date-range {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 2px;
}

.calendar-section {
  margin-top: 24px;
  background: white;
  border-radius: 12px;
  padding: 16px;
  overflow: hidden;
}

.date-activities-popup {
  padding: 20px 16px;
}

.popup-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
  text-align: center;
}
</style>
