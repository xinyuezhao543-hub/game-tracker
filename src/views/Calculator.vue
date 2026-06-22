<template>
  <div class="page-container">
    <van-nav-bar title="货币计算器" fixed placeholder />

    <van-cell-group inset title="选择游戏" style="margin-top: 12px;">
      <van-field
        v-model="gameLabel"
        is-link
        readonly
        placeholder="请选择游戏"
        @click="showGamePicker = true"
      />
    </van-cell-group>

    <template v-if="selectedGameId">
      <van-cell-group inset title="当前持有" style="margin-top: 12px;">
        <van-field
          v-model="config.currentAmount"
          type="digit"
          label="当前钻石"
          placeholder="0"
          @blur="saveConfig"
        />
      </van-cell-group>

      <van-cell-group inset title="收入来源" style="margin-top: 12px;">
        <div v-for="(income, idx) in config.incomes" :key="idx" class="income-item">
          <van-field v-model="income.source" label="来源" placeholder="如: 日常任务" @blur="saveConfig" />
          <van-field v-model="income.amount" type="digit" label="数量" placeholder="0" @blur="saveConfig" />
          <van-field
            v-model="incomeFreqLabels[idx]"
            is-link
            readonly
            label="频率"
            @click="editIncomeFreq(idx)"
          />
          <van-button
            size="small"
            type="danger"
            plain
            style="margin: 0 16px 8px;"
            @click="removeIncome(idx)"
          >删除</van-button>
        </div>
        <van-button
          size="small"
          block
          plain
          style="margin: 8px 16px; width: calc(100% - 32px);"
          @click="addIncome"
        >+ 添加收入来源</van-button>
      </van-cell-group>

      <van-cell-group inset title="计算目标" style="margin-top: 12px;">
        <van-field
          v-model="targetDateLabel"
          is-link
          readonly
          label="目标日期"
          placeholder="选择日期"
          @click="showDatePicker = true"
        />
        <van-field
          v-model="config.costPerPull"
          type="digit"
          label="每抽消耗"
          placeholder="如: 100"
          @blur="saveConfig"
        />
      </van-cell-group>

      <!-- 计算结果 -->
      <div v-if="targetDate" class="result-card card" style="margin-top: 16px;">
        <div class="result-title">💎 预计累计钻石</div>
        <div class="result-number">{{ totalAmount }}</div>
        <div v-if="totalPulls !== null" class="result-pulls">
          🎰 相当于 <strong>{{ totalPulls }}</strong> 抽
        </div>
        <div class="result-detail">
          <span>当前持有: {{ config.currentAmount || 0 }}</span>
          <span>预计收入: {{ earnedAmount }}</span>
          <span>天数: {{ daysDiff }}天</span>
        </div>
        <div class="result-breakdown" v-if="breakdown.length > 0">
          <div class="section-title" style="margin-top: 12px;">收入明细</div>
          <div v-for="item in breakdown" :key="item.source" class="breakdown-item">
            <span>{{ item.source }}</span>
            <span>{{ item.total }} ({{ item.desc }})</span>
          </div>
        </div>
      </div>
    </template>

    <!-- 游戏选择器 -->
    <van-popup v-model:show="showGamePicker" position="bottom" round>
      <van-picker
        :columns="gameColumns"
        @confirm="onGameConfirm"
        @cancel="showGamePicker = false"
      />
    </van-popup>

    <!-- 日期选择器 -->
    <van-popup v-model:show="showDatePicker" position="bottom" round>
      <van-date-picker
        v-model="targetDateValues"
        title="选择目标日期"
        :min-date="new Date()"
        :max-date="new Date(2030, 11, 31)"
        @confirm="onDateConfirm"
        @cancel="showDatePicker = false"
      />
    </van-popup>

    <!-- 频率选择器 -->
    <van-popup v-model:show="showFreqPicker" position="bottom" round>
      <van-picker
        :columns="freqColumns"
        @confirm="onFreqConfirm"
        @cancel="showFreqPicker = false"
      />
    </van-popup>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { getGames, getCurrencyConfigByGameId, saveCurrencyConfig } from '../utils/storage'

const games = ref([])
const selectedGameId = ref('')
const showGamePicker = ref(false)
const showDatePicker = ref(false)
const showFreqPicker = ref(false)
const editingFreqIdx = ref(-1)
const targetDate = ref(null)

const today = new Date()
const targetDateValues = ref([
  String(today.getFullYear()),
  String(today.getMonth() + 1).padStart(2, '0'),
  String(today.getDate()).padStart(2, '0')
])

const config = ref({
  gameId: '',
  currentAmount: 0,
  incomes: []
})

const freqColumns = [
  { text: '每天', value: 'daily' },
  { text: '每周', value: 'weekly' },
  { text: '每两周', value: 'biweekly' },
  { text: '每月', value: 'monthly' },
  { text: '一次性', value: 'once' },
]

const freqLabels = {
  daily: '每天',
  weekly: '每周',
  biweekly: '每两周',
  monthly: '每月',
  once: '一次性'
}

onMounted(() => {
  games.value = getGames()
})

const gameColumns = computed(() => {
  return games.value.map(g => ({ text: g.name, value: g.id }))
})

const gameLabel = computed(() => {
  const game = games.value.find(g => g.id === selectedGameId.value)
  return game ? game.name : ''
})

const incomeFreqLabels = computed(() => {
  return config.value.incomes.map(i => freqLabels[i.frequency] || '每天')
})

const targetDateLabel = computed(() => {
  if (!targetDate.value) return ''
  const d = new Date(targetDate.value)
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
})

function onGameConfirm({ selectedOptions }) {
  if (selectedOptions && selectedOptions[0]) {
    selectedGameId.value = selectedOptions[0].value
    loadConfig()
  }
  showGamePicker.value = false
}

function loadConfig() {
  const saved = getCurrencyConfigByGameId(selectedGameId.value)
  if (saved) {
    config.value = { ...saved }
  } else {
    config.value = {
      gameId: selectedGameId.value,
      currentAmount: 0,
      incomes: []
    }
  }
}

function saveConfig() {
  if (!selectedGameId.value) return
  config.value.gameId = selectedGameId.value
  saveCurrencyConfig(config.value)
}

function addIncome() {
  config.value.incomes.push({ source: '', amount: 0, frequency: 'daily' })
  saveConfig()
}

function removeIncome(idx) {
  config.value.incomes.splice(idx, 1)
  saveConfig()
}

function editIncomeFreq(idx) {
  editingFreqIdx.value = idx
  showFreqPicker.value = true
}

function onFreqConfirm({ selectedOptions }) {
  if (selectedOptions && selectedOptions[0]) {
    config.value.incomes[editingFreqIdx.value].frequency = selectedOptions[0].value
    saveConfig()
  }
  showFreqPicker.value = false
}

function onDateConfirm({ selectedValues }) {
  const [y, m, d] = selectedValues
  targetDate.value = `${y}-${m}-${d}`
  showDatePicker.value = false
}

const daysDiff = computed(() => {
  if (!targetDate.value) return 0
  const target = new Date(targetDate.value)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24))
  return Math.max(0, diff)
})

const breakdown = computed(() => {
  if (!targetDate.value) return []
  return config.value.incomes
    .filter(i => i.amount > 0 && i.source)
    .map(i => {
      const amount = Number(i.amount) || 0
      let times = 0
      let desc = ''
      switch (i.frequency) {
        case 'daily':
          times = daysDiff.value
          desc = `${amount} × ${times}天`
          break
        case 'weekly':
          times = Math.floor(daysDiff.value / 7)
          desc = `${amount} × ${times}周`
          break
        case 'biweekly':
          times = Math.floor(daysDiff.value / 14)
          desc = `${amount} × ${times}次`
          break
        case 'monthly':
          times = Math.floor(daysDiff.value / 30)
          desc = `${amount} × ${times}月`
          break
        case 'once':
          times = 1
          desc = `一次性`
          break
      }
      return { source: i.source, total: amount * times, desc }
    })
})

const earnedAmount = computed(() => {
  return breakdown.value.reduce((sum, item) => sum + item.total, 0)
})

const totalAmount = computed(() => {
  return (Number(config.value.currentAmount) || 0) + earnedAmount.value
})

const totalPulls = computed(() => {
  const cost = Number(config.value.costPerPull)
  if (!cost || cost <= 0) return null
  return Math.floor(totalAmount.value / cost)
})
</script>

<style scoped>
.income-item {
  border-bottom: 1px solid #f5f5f5;
  padding-bottom: 8px;
  margin-bottom: 8px;
}

.result-card {
  text-align: center;
}

.result-title {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.result-number {
  font-size: 36px;
  font-weight: 700;
  color: var(--primary-color);
  margin-bottom: 12px;
}

.result-pulls {
  font-size: 16px;
  color: #ff9800;
  margin-bottom: 12px;
}

.result-pulls strong {
  font-size: 22px;
}

.result-detail {
  display: flex;
  justify-content: space-around;
  font-size: 12px;
  color: var(--text-muted);
}

.result-breakdown {
  text-align: left;
  margin-top: 8px;
}

.breakdown-item {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  padding: 6px 0;
  border-bottom: 1px solid #f8f8f8;
}
</style>
