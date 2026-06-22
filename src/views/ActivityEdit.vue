<template>
  <div class="page-container">
    <van-nav-bar
      :title="isEdit ? '编辑活动' : '添加活动'"
      left-arrow
      @click-left="$router.back()"
      fixed
      placeholder
    />

    <van-form @submit="onSubmit">
      <van-cell-group inset>
        <van-field
          v-model="form.name"
          label="活动名称"
          placeholder="请输入活动名称"
          :rules="[{ required: true, message: '请输入活动名称' }]"
        />

        <van-field
          v-model="gameLabel"
          is-link
          readonly
          label="所属游戏"
          placeholder="请选择游戏"
          @click="showGamePicker = true"
          :rules="[{ required: true, message: '请选择游戏' }]"
        />

        <van-field
          v-model="startDateLabel"
          is-link
          readonly
          label="开始时间"
          placeholder="请选择开始时间"
          @click="showStartPicker = true"
          :rules="[{ required: true, message: '请选择开始时间' }]"
        />

        <van-field
          v-model="endDateLabel"
          is-link
          readonly
          label="结束时间"
          placeholder="请选择结束时间"
          @click="showEndPicker = true"
          :rules="[{ required: true, message: '请选择结束时间' }]"
        />

        <van-field
          v-model="form.notes"
          label="备注"
          type="textarea"
          placeholder="可选备注"
          rows="2"
          autosize
        />
      </van-cell-group>

      <div style="margin: 16px;">
        <van-button round block type="primary" native-type="submit">
          保存
        </van-button>
        <van-button
          v-if="isEdit"
          round
          block
          type="danger"
          plain
          style="margin-top: 12px;"
          @click="onDelete"
        >
          删除活动
        </van-button>
      </div>
    </van-form>

    <!-- 游戏选择器 -->
    <van-popup v-model:show="showGamePicker" position="bottom" round>
      <van-picker
        :columns="gameColumns"
        @confirm="onGameConfirm"
        @cancel="showGamePicker = false"
      />
    </van-popup>

    <!-- 开始时间选择器 -->
    <van-popup v-model:show="showStartPicker" position="bottom" round>
      <van-date-picker
        v-model="startDateValues"
        title="选择开始日期"
        :min-date="new Date(2020, 0, 1)"
        :max-date="new Date(2030, 11, 31)"
        @confirm="onStartConfirm"
        @cancel="showStartPicker = false"
      />
    </van-popup>

    <!-- 结束时间选择器 -->
    <van-popup v-model:show="showEndPicker" position="bottom" round>
      <van-date-picker
        v-model="endDateValues"
        title="选择结束日期"
        :min-date="new Date(2020, 0, 1)"
        :max-date="new Date(2030, 11, 31)"
        @confirm="onEndConfirm"
        @cancel="showEndPicker = false"
      />
    </van-popup>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast, showConfirmDialog } from 'vant'
import { getGames, getActivities, addActivity, updateActivity, deleteActivity, genId } from '../utils/storage'

const route = useRoute()
const router = useRouter()

const isEdit = computed(() => route.name === 'activity-edit')
const activityId = computed(() => route.params.id)

const form = ref({
  name: '',
  gameId: '',
  startDate: '',
  endDate: '',
  notes: ''
})

const games = ref([])
const showGamePicker = ref(false)
const showStartPicker = ref(false)
const showEndPicker = ref(false)

const today = new Date()
const startDateValues = ref([
  String(today.getFullYear()),
  String(today.getMonth() + 1).padStart(2, '0'),
  String(today.getDate()).padStart(2, '0')
])
const endDateValues = ref([
  String(today.getFullYear()),
  String(today.getMonth() + 1).padStart(2, '0'),
  String(today.getDate()).padStart(2, '0')
])

onMounted(() => {
  games.value = getGames()
  if (isEdit.value) {
    const activity = getActivities().find(a => a.id === activityId.value)
    if (activity) {
      form.value = { ...activity }
      if (activity.startDate) {
        const d = new Date(activity.startDate)
        startDateValues.value = [
          String(d.getFullYear()),
          String(d.getMonth() + 1).padStart(2, '0'),
          String(d.getDate()).padStart(2, '0')
        ]
      }
      if (activity.endDate) {
        const d = new Date(activity.endDate)
        endDateValues.value = [
          String(d.getFullYear()),
          String(d.getMonth() + 1).padStart(2, '0'),
          String(d.getDate()).padStart(2, '0')
        ]
      }
    }
  }
})

const gameColumns = computed(() => {
  return games.value.map(g => ({ text: g.name, value: g.id }))
})

const gameLabel = computed(() => {
  const game = games.value.find(g => g.id === form.value.gameId)
  return game ? game.name : ''
})

const startDateLabel = computed(() => {
  return form.value.startDate ? formatDateStr(form.value.startDate) : ''
})

const endDateLabel = computed(() => {
  return form.value.endDate ? formatDateStr(form.value.endDate) : ''
})

function formatDateStr(dateStr) {
  const d = new Date(dateStr)
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}

function onGameConfirm({ selectedOptions }) {
  if (selectedOptions && selectedOptions[0]) {
    form.value.gameId = selectedOptions[0].value
  }
  showGamePicker.value = false
}

function onStartConfirm({ selectedValues }) {
  const [y, m, d] = selectedValues
  form.value.startDate = `${y}-${m}-${d}`
  showStartPicker.value = false
}

function onEndConfirm({ selectedValues }) {
  const [y, m, d] = selectedValues
  form.value.endDate = `${y}-${m}-${d}`
  showEndPicker.value = false
}

function onSubmit() {
  if (!form.value.gameId) {
    showToast('请选择游戏')
    return
  }
  if (isEdit.value) {
    updateActivity(form.value)
    showToast('活动已更新')
  } else {
    const activity = { ...form.value, id: genId() }
    addActivity(activity)
    showToast('活动已添加')
  }
  router.back()
}

function onDelete() {
  showConfirmDialog({
    title: '确认删除',
    message: '确定要删除这个活动吗？',
  }).then(() => {
    deleteActivity(activityId.value)
    showToast('已删除')
    router.back()
  }).catch(() => {})
}
</script>
