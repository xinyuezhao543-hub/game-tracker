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
      <div class="calendar-header">
        <button class="cal-nav-btn" @click="prevMonth">‹</button>
        <span class="cal-month-label" @click="showMonthPicker = true">
          {{ calYear }}年{{ calMonth + 1 }}月
        </span>
        <button class="cal-nav-btn" @click="nextMonth">›</button>
      </div>
      <div class="calendar-weekdays">
        <span v-for="w in ['日','一','二','三','四','五','六']" :key="w" class="cal-weekday">{{ w }}</span>
      </div>
      <div class="calendar-grid">
        <div
          v-for="(day, idx) in calendarDays"
          :key="idx"
          class="cal-day"
          :class="{
            'cal-day-other': !day.currentMonth,
            'cal-day-today': day.isToday,
            'cal-day-has-activity': day.hasActivity
          }"
          @click="day.currentMonth && onDayClick(day.date)"
        >
          <span class="cal-day-num">{{ day.day }}</span>
          <span v-if="day.hasActivity" class="cal-dot">●</span>
        </div>
      </div>
    </div>

    <!-- 月份选择器 -->
    <van-popup v-model:show="showMonthPicker" position="bottom" round>
      <van-date-picker
        v-model="pickerDate"
        title="选择年月"
        :columns-type="['year', 'month']"
        :min-date="new Date(2020, 0, 1)"
        :max-date="new Date(2030, 11, 31)"
        @confirm="onMonthPickerConfirm"
        @cancel="showMonthPicker = false"
      />
    </van-popup>

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

// 自定义日历相关
const calYear = ref(new Date().getFullYear())
const calMonth = ref(new Date().getMonth())
const showMonthPicker = ref(false)
const pickerDate = ref([String(new Date().getFullYear()), String(new Date().getMonth() + 1).padStart(2, '0')])

function prevMonth() {
  if (calMonth.value === 0) {
    calMonth.value = 11
    calYear.value--
  } else {
    calMonth.value--
  }
}

function nextMonth() {
  if (calMonth.value === 11) {
    calMonth.value = 0
    calYear.value++
  } else {
    calMonth.value++
  }
}

function onMonthPickerConfirm({ selectedValues }) {
  calYear.value = Number(selectedValues[0])
  calMonth.value = Number(selectedValues[1]) - 1
  showMonthPicker.value = false
}

const calendarDays = computed(() => {
  const year = calYear.value
  const month = calMonth.value
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrevMonth = new Date(year, month, 0).getDate()
  const today = formatDateKey(new Date())
  const days = []

  // 上月末尾
  for (let i = firstDay - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i
    days.push({ day: d, currentMonth: false, date: null, isToday: false, hasActivity: false })
  }

  // 当月
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d)
    const dateStr = formatDateKey(date)
    const hasActivity = activities.value.some(a => {
      const start = formatDateKey(new Date(a.startDate))
      const end = formatDateKey(new Date(a.endDate))
      return dateStr >= start && dateStr <= end
    })
    days.push({
      day: d,
      currentMonth: true,
      date,
      isToday: dateStr === today,
      hasActivity
    })
  }

  // 下月开头补齐到42格（6行）
  const remaining = 42 - days.length
  for (let d = 1; d <= remaining; d++) {
    days.push({ day: d, currentMonth: false, date: null, isToday: false, hasActivity: false })
  }

  return days
})

function onDayClick(date) {
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

.calendar-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-bottom: 12px;
}

.cal-nav-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: #f5f5f5;
  border-radius: 50%;
  font-size: 18px;
  color: #333;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cal-nav-btn:active {
  background: #e0e0e0;
}

.cal-month-label {
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  padding: 4px 12px;
  border-radius: 6px;
}

.cal-month-label:active {
  background: #f0f0f0;
}

.calendar-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  margin-bottom: 4px;
}

.cal-weekday {
  font-size: 12px;
  color: #999;
  padding: 4px 0;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}

.cal-day {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 40px;
  border-radius: 8px;
  cursor: pointer;
  position: relative;
}

.cal-day:active {
  background: #f0f0f0;
}

.cal-day-other {
  opacity: 0.3;
  pointer-events: none;
}

.cal-day-today .cal-day-num {
  background: #4fc3f7;
  color: white;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cal-day-num {
  font-size: 14px;
}

.cal-dot {
  font-size: 6px;
  color: #4fc3f7;
  position: absolute;
  bottom: 2px;
}

.cal-day-has-activity .cal-day-num {
  font-weight: 600;
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
