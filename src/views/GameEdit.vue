<template>
  <div class="page-container">
    <van-nav-bar
      :title="isEdit ? '编辑游戏' : '添加游戏'"
      left-arrow
      @click-left="$router.back()"
      fixed
      placeholder
    />

    <van-form @submit="onSubmit">
      <van-cell-group inset>
        <van-field label="游戏图标">
          <template #input>
            <div class="icon-upload" @click="triggerIconUpload">
              <img v-if="form.icon" :src="form.icon" class="icon-preview" />
              <span v-else>点击上传</span>
            </div>
            <input ref="iconInput" type="file" accept="image/*" style="display:none;" @change="onIconChange" />
          </template>
        </van-field>

        <van-field
          v-model="form.name"
          label="游戏名称"
          placeholder="请输入游戏名称"
          :rules="[{ required: true, message: '请输入游戏名称' }]"
        />

        <van-field
          v-model="typeLabel"
          is-link
          readonly
          label="游戏类型"
          placeholder="请选择类型"
          @click="showTypePicker = true"
        />

        <van-field
          v-model="startDateLabel"
          is-link
          readonly
          label="开始游玩"
          placeholder="选择日期"
          @click="showStartPicker = true"
        />

        <van-field label="状态">
          <template #input>
            <van-switch v-model="isAbandoned" size="20" />
            <span style="margin-left: 8px; font-size: 13px;">{{ isAbandoned ? '已弃坑' : '游玩中' }}</span>
          </template>
        </van-field>

        <van-field
          v-if="isAbandoned"
          v-model="abandonDateLabel"
          is-link
          readonly
          label="弃坑日期"
          placeholder="选择日期"
          @click="showAbandonPicker = true"
        />

        <van-field v-model="form.notes" label="备注" type="textarea" placeholder="可选备注" rows="2" autosize />
      </van-cell-group>

      <div style="margin: 16px;">
        <van-button round block type="primary" native-type="submit">保存</van-button>
        <van-button v-if="isEdit" round block type="danger" plain style="margin-top: 12px;" @click="onDelete">
          删除游戏
        </van-button>
      </div>
    </van-form>

    <van-popup v-model:show="showTypePicker" position="bottom" round>
      <van-picker :columns="typeColumns" @confirm="onTypeConfirm" @cancel="showTypePicker = false" />
    </van-popup>

    <van-popup v-model:show="showStartPicker" position="bottom" round>
      <van-date-picker v-model="startDateValues" title="开始游玩日期" @confirm="onStartConfirm" @cancel="showStartPicker = false" />
    </van-popup>

    <van-popup v-model:show="showAbandonPicker" position="bottom" round>
      <van-date-picker v-model="abandonDateValues" title="弃坑日期" @confirm="onAbandonConfirm" @cancel="showAbandonPicker = false" />
    </van-popup>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast, showConfirmDialog } from 'vant'
import { getGames, addGame, updateGame, deleteGame, genId } from '../utils/storage'

const route = useRoute()
const router = useRouter()
const isEdit = computed(() => route.name === 'game-edit')
const gameId = computed(() => route.params.id)

const form = ref({ name: '', type: 'dress', icon: '', startDate: '', abandonDate: '', notes: '', status: 'active' })
const isAbandoned = ref(false)
const iconInput = ref(null)

const showTypePicker = ref(false)
const showStartPicker = ref(false)
const showAbandonPicker = ref(false)

const today = new Date()
const startDateValues = ref([String(today.getFullYear()), String(today.getMonth()+1).padStart(2,'0'), String(today.getDate()).padStart(2,'0')])
const abandonDateValues = ref([...startDateValues.value])

const typeColumns = [
  { text: '换装', value: 'dress' },
  { text: '卡牌/乙女', value: 'card' },
  { text: '其他', value: 'other' },
]
const typeLabelsMap = { dress: '换装', card: '卡牌/乙女', other: '其他' }

onMounted(() => {
  if (isEdit.value) {
    const game = getGames().find(g => g.id === gameId.value)
    if (game) {
      form.value = { ...game }
      isAbandoned.value = game.status === 'abandoned'
      if (game.startDate) {
        const d = new Date(game.startDate)
        startDateValues.value = [String(d.getFullYear()), String(d.getMonth()+1).padStart(2,'0'), String(d.getDate()).padStart(2,'0')]
      }
      if (game.abandonDate) {
        const d = new Date(game.abandonDate)
        abandonDateValues.value = [String(d.getFullYear()), String(d.getMonth()+1).padStart(2,'0'), String(d.getDate()).padStart(2,'0')]
      }
    }
  }
})

const typeLabel = computed(() => typeLabelsMap[form.value.type] || '')
const startDateLabel = computed(() => form.value.startDate ? formatDate(form.value.startDate) : '')
const abandonDateLabel = computed(() => form.value.abandonDate ? formatDate(form.value.abandonDate) : '')

function formatDate(d) { const dt = new Date(d); return `${dt.getFullYear()}年${dt.getMonth()+1}月${dt.getDate()}日` }

function onTypeConfirm({ selectedOptions }) {
  if (selectedOptions?.[0]) form.value.type = selectedOptions[0].value
  showTypePicker.value = false
}
function onStartConfirm({ selectedValues }) {
  form.value.startDate = selectedValues.join('-')
  showStartPicker.value = false
}
function onAbandonConfirm({ selectedValues }) {
  form.value.abandonDate = selectedValues.join('-')
  showAbandonPicker.value = false
}

function triggerIconUpload() { iconInput.value?.click() }
function onIconChange(e) {
  const file = e.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (ev) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const size = 120
      canvas.width = size; canvas.height = size
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, size, size)
      form.value.icon = canvas.toDataURL('image/jpeg', 0.8)
    }
    img.src = ev.target.result
  }
  reader.readAsDataURL(file)
}

function onSubmit() {
  form.value.status = isAbandoned.value ? 'abandoned' : 'active'
  if (isEdit.value) {
    updateGame(form.value)
    showToast('已更新')
  } else {
    addGame({ ...form.value, id: genId() })
    showToast('已添加')
  }
  router.back()
}

function onDelete() {
  showConfirmDialog({ title: '确认删除', message: '删除游戏将同时删除相关的活动和收集记录' })
    .then(() => { deleteGame(gameId.value); showToast('已删除'); router.back() })
    .catch(() => {})
}
</script>

<style scoped>
.icon-upload {
  width: 70px; height: 70px; border: 1px dashed #ccc; border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; font-size: 12px; color: var(--text-muted); overflow: hidden;
}
.icon-preview { width: 100%; height: 100%; object-fit: cover; }
</style>
