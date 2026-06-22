<template>
  <div class="page-container">
    <van-nav-bar
      :title="game?.name || '卡牌收集'"
      left-arrow
      @click-left="$router.back()"
      fixed
      placeholder
    >
      <template #right>
        <span @click="showAddEvent = true" style="font-size: 20px; cursor: pointer;">+</span>
      </template>
    </van-nav-bar>

    <div v-if="collections.length > 0">
      <van-collapse v-model="activeNames">
        <van-collapse-item
          v-for="(col, idx) in collections"
          :key="col.id"
          :name="col.id"
        >
          <template #title>
            <div class="event-header">
              <span class="event-name">{{ col.eventName }}</span>
              <span class="event-stats">{{ getEventStats(col) }}</span>
            </div>
          </template>

          <div class="cards-grid">
            <div
              v-for="(card, cIdx) in col.cards"
              :key="cIdx"
              class="card-item"
              :class="{ obtained: card.obtained }"
              @click="toggleCard(idx, cIdx)"
            >
              <div class="card-image-wrapper">
                <img v-if="card.image" :src="card.image" class="card-image" :alt="card.name" />
                <div v-else class="card-image-placeholder">
                  {{ card.name?.charAt(0) || '?' }}
                </div>
                <div v-if="card.obtained" class="obtained-overlay">✓</div>
              </div>
              <div class="card-name">{{ card.name }}</div>
            </div>
          </div>

          <div class="event-actions">
            <van-button size="small" @click="addCardToEvent(idx)">添加卡牌</van-button>
            <van-button size="small" plain @click="editEvent(idx)">编辑</van-button>
            <van-button size="small" type="danger" plain @click="deleteEvent(idx)">删除</van-button>
          </div>
        </van-collapse-item>
      </van-collapse>
    </div>

    <div v-else class="empty-state">
      <div class="empty-state-icon">🃏</div>
      <p>暂无活动记录</p>
      <p style="font-size: 13px; margin-top: 8px;">点击右上角 + 添加活动</p>
    </div>

    <!-- 添加活动弹窗 -->
    <van-dialog
      v-model:show="showAddEvent"
      title="添加活动"
      show-cancel-button
      @confirm="confirmAddEvent"
    >
      <van-field v-model="newEventName" label="活动名称" placeholder="请输入活动名称" />
    </van-dialog>

    <!-- 编辑活动弹窗 -->
    <van-dialog
      v-model:show="showEditEvent"
      title="编辑活动名称"
      show-cancel-button
      @confirm="confirmEditEvent"
    >
      <van-field v-model="editEventName" label="活动名称" placeholder="请输入活动名称" />
    </van-dialog>

    <!-- 添加卡牌弹窗 -->
    <van-dialog
      v-model:show="showAddCard"
      title="添加卡牌"
      show-cancel-button
      @confirm="confirmAddCard"
    >
      <van-field v-model="newCardName" label="卡牌名称" placeholder="请输入卡牌名称" />
      <van-field label="卡牌图片" class="upload-field">
        <template #input>
          <div class="upload-area" @click="triggerCardUpload">
            <img v-if="newCardImage" :src="newCardImage" class="upload-preview" />
            <span v-else>点击上传图片</span>
          </div>
          <input
            ref="cardFileInput"
            type="file"
            accept="image/*"
            style="display: none;"
            @change="onCardImageChange"
          />
        </template>
      </van-field>
    </van-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { showToast, showConfirmDialog } from 'vant'
import { getGameById, getCardCollections, saveCardCollections, genId } from '../utils/storage'

const route = useRoute()
const gameId = route.params.gameId
const game = ref(null)
const collections = ref([])
const activeNames = ref([])

const showAddEvent = ref(false)
const newEventName = ref('')
const showEditEvent = ref(false)
const editEventName = ref('')
const editingEventIdx = ref(-1)
const showAddCard = ref(false)
const newCardName = ref('')
const newCardImage = ref('')
const addingCardEventIdx = ref(-1)
const cardFileInput = ref(null)

onMounted(() => {
  game.value = getGameById(gameId)
  loadCollections()
})

function loadCollections() {
  collections.value = getCardCollections().filter(c => c.gameId === gameId)
  if (collections.value.length > 0) {
    activeNames.value = [collections.value[0].id]
  }
}

function saveAll() {
  const allCollections = getCardCollections().filter(c => c.gameId !== gameId)
  allCollections.push(...collections.value)
  saveCardCollections(allCollections)
}

function getEventStats(col) {
  const total = col.cards?.length || 0
  const obtained = col.cards?.filter(c => c.obtained)?.length || 0
  return `${obtained}/${total}`
}

function confirmAddEvent() {
  if (!newEventName.value.trim()) {
    showToast('请输入活动名称')
    return
  }
  const newCol = {
    id: genId(),
    gameId,
    eventName: newEventName.value.trim(),
    cards: []
  }
  collections.value.push(newCol)
  saveAll()
  newEventName.value = ''
  activeNames.value = [newCol.id]
  showToast('活动已添加')
}

function editEvent(idx) {
  editingEventIdx.value = idx
  editEventName.value = collections.value[idx].eventName
  showEditEvent.value = true
}

function confirmEditEvent() {
  if (!editEventName.value.trim()) return
  collections.value[editingEventIdx.value].eventName = editEventName.value.trim()
  saveAll()
  showToast('已更新')
}

function deleteEvent(idx) {
  showConfirmDialog({
    title: '确认删除',
    message: '确定要删除这个活动及其所有卡牌吗？',
  }).then(() => {
    collections.value.splice(idx, 1)
    saveAll()
    showToast('已删除')
  }).catch(() => {})
}

function addCardToEvent(idx) {
  addingCardEventIdx.value = idx
  newCardName.value = ''
  newCardImage.value = ''
  showAddCard.value = true
}

function triggerCardUpload() {
  cardFileInput.value?.click()
}

function onCardImageChange(e) {
  const file = e.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (ev) => {
    compressImage(ev.target.result, 200, (compressed) => {
      newCardImage.value = compressed
    })
  }
  reader.readAsDataURL(file)
}

function compressImage(dataUrl, maxSize, callback) {
  const img = new Image()
  img.onload = () => {
    const canvas = document.createElement('canvas')
    let w = img.width
    let h = img.height
    if (w > maxSize || h > maxSize) {
      if (w > h) {
        h = (h / w) * maxSize
        w = maxSize
      } else {
        w = (w / h) * maxSize
        h = maxSize
      }
    }
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    ctx.drawImage(img, 0, 0, w, h)
    callback(canvas.toDataURL('image/jpeg', 0.7))
  }
  img.src = dataUrl
}

function confirmAddCard() {
  if (!newCardName.value.trim()) {
    showToast('请输入卡牌名称')
    return
  }
  const card = {
    name: newCardName.value.trim(),
    image: newCardImage.value || '',
    obtained: false
  }
  collections.value[addingCardEventIdx.value].cards.push(card)
  saveAll()
  showToast('卡牌已添加')
}

function toggleCard(colIdx, cardIdx) {
  collections.value[colIdx].cards[cardIdx].obtained = !collections.value[colIdx].cards[cardIdx].obtained
  saveAll()
}
</script>

<style scoped>
.event-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.event-name {
  font-weight: 500;
}

.event-stats {
  font-size: 12px;
  color: var(--primary-color);
  background: #e1f5fe;
  padding: 2px 8px;
  border-radius: 10px;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  padding: 8px 0;
}

.card-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  cursor: pointer;
}

.card-image-wrapper {
  position: relative;
  width: 80px;
  height: 100px;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid #e0e0e0;
  transition: all 0.2s;
}

.card-item.obtained .card-image-wrapper {
  border-color: var(--success-color);
}

.card-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.card-image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  font-size: 20px;
  color: var(--text-muted);
}

.obtained-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(102, 187, 106, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: white;
  font-weight: bold;
}

.card-item:not(.obtained) .card-image-wrapper {
  opacity: 0.6;
}

.card-name {
  font-size: 12px;
  color: var(--text-secondary);
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 80px;
}

.event-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.upload-area {
  width: 80px;
  height: 80px;
  border: 1px dashed #ccc;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 12px;
  color: var(--text-muted);
  overflow: hidden;
}

.upload-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
