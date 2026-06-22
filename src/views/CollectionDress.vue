<template>
  <div class="page-container">
    <van-nav-bar
      :title="game?.name || '换装收集'"
      left-arrow
      @click-left="$router.back()"
      fixed
      placeholder
    >
      <template #right>
        <span @click="showAdd = true" style="font-size: 20px; cursor: pointer;">+</span>
      </template>
    </van-nav-bar>

    <div v-if="collections.length > 0" class="suit-grid">
      <div
        v-for="(suit, idx) in collections"
        :key="suit.id"
        class="suit-card"
        @click="openDetail(idx)"
      >
        <div class="suit-image-wrapper">
          <img v-if="suit.image" :src="suit.image" class="suit-image" :alt="suit.name" />
          <div v-else class="suit-image-placeholder">👗</div>
          <div class="suit-badge" :class="{ complete: suit.collected >= suit.totalParts }">
            {{ suit.collected }}/{{ suit.totalParts }}
          </div>
        </div>
        <div class="suit-name">{{ suit.name }}</div>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: getProgress(suit) + '%' }"></div>
        </div>
        <div v-if="suit.note" class="suit-note-preview">{{ suit.note }}</div>
      </div>
    </div>

    <div v-else class="empty-state">
      <div class="empty-state-icon">👗</div>
      <p>暂无套装</p>
      <p style="font-size: 13px; margin-top: 8px;">点击右上角 + 添加套装</p>
    </div>

    <!-- 详情弹窗 -->
    <van-popup v-model:show="showDetail" position="bottom" round :style="{ minHeight: '50%' }">
      <div v-if="detailIdx >= 0" class="detail-content">
        <div class="detail-header">
          <div class="detail-image-wrapper" @click="viewImage(collections[detailIdx])">
            <img v-if="collections[detailIdx].image" :src="collections[detailIdx].image" class="detail-image" />
            <div v-else class="suit-image-placeholder" style="width:120px;height:120px;">👗</div>
          </div>
          <div class="detail-info">
            <div class="detail-name">{{ collections[detailIdx].name }}</div>
            <div class="detail-progress">{{ collections[detailIdx].collected }} / {{ collections[detailIdx].totalParts }}</div>
            <div class="detail-actions">
              <van-button size="small" @click="decreaseCollected(detailIdx)">−</van-button>
              <van-button size="small" type="primary" @click="increaseCollected(detailIdx)">+</van-button>
            </div>
          </div>
        </div>
        <van-field
          v-model="collections[detailIdx].note"
          type="textarea"
          rows="3"
          autosize
          label="备注"
          placeholder="输入抽取/进化备注..."
          @blur="saveAll()"
          style="margin-top: 12px;"
        />
        <div class="detail-bottom-actions">
          <van-button size="small" plain @click="editSuit(detailIdx)">编辑</van-button>
          <van-button size="small" type="danger" plain @click="deleteSuit(detailIdx)">删除</van-button>
        </div>
      </div>
    </van-popup>

    <!-- 添加/编辑套装弹窗 -->
    <van-popup v-model:show="showAdd" position="bottom" round :style="{ minHeight: '40%' }">
      <div class="popup-content">
        <div class="popup-title">{{ editingIdx >= 0 ? '编辑套装' : '添加套装' }}</div>
        <van-field v-model="form.name" label="套装名称" placeholder="请输入套装名称" />
        <van-field v-model.number="form.totalParts" type="digit" label="部件总数" placeholder="请输入部件总数" />
        <van-field v-model.number="form.collected" type="digit" label="已收集" placeholder="已收集数量" />
        <van-field label="套装图片">
          <template #input>
            <div class="upload-area" @click="triggerUpload">
              <img v-if="form.image" :src="form.image" class="upload-preview" />
              <span v-else>点击上传图片</span>
            </div>
            <input
              ref="fileInput"
              type="file"
              accept="image/*"
              style="display: none;"
              @change="onImageChange"
            />
          </template>
        </van-field>
        <van-field v-model="form.note" type="textarea" label="备注" rows="3" autosize placeholder="记录抽取/进化情况" />
        <div class="popup-actions">
          <van-button block type="primary" @click="confirmSave">保存</van-button>
        </div>
      </div>
    </van-popup>

    <!-- 查看大图 -->
    <van-popup v-model:show="showImageView" :style="{ background: 'rgba(0,0,0,0.9)', width: '100%', height: '100%' }" @click="showImageView = false">
      <div class="image-view">
        <img :src="viewingImage" class="full-image" />
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { showToast, showConfirmDialog } from 'vant'
import { getGameById, getDressCollections, saveDressCollections, genId } from '../utils/storage'

const route = useRoute()
const gameId = route.params.gameId
const game = ref(null)
const collections = ref([])

const showAdd = ref(false)
const editingIdx = ref(-1)
const form = ref({ name: '', totalParts: 0, collected: 0, image: '', note: '' })
const fileInput = ref(null)

const showDetail = ref(false)
const detailIdx = ref(-1)
const showImageView = ref(false)
const viewingImage = ref('')

function openDetail(idx) {
  detailIdx.value = idx
  showDetail.value = true
}

onMounted(() => {
  game.value = getGameById(gameId)
  loadCollections()
})

function loadCollections() {
  collections.value = getDressCollections().filter(c => c.gameId === gameId)
}

function saveAll() {
  const allCollections = getDressCollections().filter(c => c.gameId !== gameId)
  allCollections.push(...collections.value)
  saveDressCollections(allCollections)
}

function getProgress(suit) {
  if (!suit.totalParts || suit.totalParts === 0) return 0
  return Math.min(100, Math.round((suit.collected / suit.totalParts) * 100))
}

function increaseCollected(idx) {
  const suit = collections.value[idx]
  if (suit.collected < suit.totalParts) {
    suit.collected++
    saveAll()
  }
}

function decreaseCollected(idx) {
  const suit = collections.value[idx]
  if (suit.collected > 0) {
    suit.collected--
    saveAll()
  }
}

function editSuit(idx) {
  editingIdx.value = idx
  const suit = collections.value[idx]
  form.value = { ...suit }
  showAdd.value = true
}

function deleteSuit(idx) {
  showConfirmDialog({
    title: '确认删除',
    message: '确定要删除这个套装吗？',
  }).then(() => {
    collections.value.splice(idx, 1)
    saveAll()
    showToast('已删除')
  }).catch(() => {})
}

function triggerUpload() {
  fileInput.value?.click()
}

function onImageChange(e) {
  const file = e.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (ev) => {
    compressImage(ev.target.result, 400, (compressed) => {
      form.value.image = compressed
    })
  }
  reader.readAsDataURL(file)
  e.target.value = ''
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

function confirmSave() {
  if (!form.value.name?.trim()) {
    showToast('请输入套装名称')
    return
  }
  if (!form.value.totalParts || form.value.totalParts <= 0) {
    showToast('请输入部件总数')
    return
  }

  if (editingIdx.value >= 0) {
    // 编辑模式
    collections.value[editingIdx.value] = { ...form.value }
  } else {
    // 新增
    const newSuit = {
      id: genId(),
      gameId,
      name: form.value.name.trim(),
      totalParts: Number(form.value.totalParts),
      collected: Number(form.value.collected) || 0,
      image: form.value.image || '',
      note: form.value.note || ''
    }
    collections.value.push(newSuit)
  }
  saveAll()
  showAdd.value = false
  editingIdx.value = -1
  form.value = { name: '', totalParts: 0, collected: 0, image: '', note: '' }
  showToast('已保存')
}

function viewImage(suit) {
  if (suit.image) {
    viewingImage.value = suit.image
    showImageView.value = true
  }
}
</script>

<style scoped>
.suit-grid {
  padding: 8px;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}

.suit-card {
  background: white;
  border-radius: 10px;
  padding: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.suit-image-wrapper {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  border: 1px solid #eee;
}

.suit-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.suit-image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f9f9f9;
  font-size: 32px;
}

.suit-badge {
  position: absolute;
  bottom: 4px;
  right: 4px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 8px;
}

.suit-badge.complete {
  background: var(--success-color, #66bb6a);
}

.suit-name {
  font-size: 12px;
  font-weight: 500;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
}

.progress-bar {
  width: 100%;
  height: 4px;
  background: #e8e8e8;
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--primary-color);
  border-radius: 2px;
  transition: width 0.3s;
}

.suit-note-preview {
  font-size: 10px;
  color: #888;
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 1.3;
  text-align: center;
}

/* 详情弹窗样式 */
.detail-content {
  padding: 20px 16px;
}

.detail-header {
  display: flex;
  gap: 16px;
}

.detail-image-wrapper {
  width: 120px;
  height: 120px;
  border-radius: 10px;
  overflow: hidden;
  flex-shrink: 0;
  border: 1px solid #eee;
}

.detail-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.detail-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-name {
  font-size: 17px;
  font-weight: 600;
}

.detail-progress {
  font-size: 15px;
  color: var(--primary-color);
  font-weight: 500;
}

.detail-actions {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}

.detail-bottom-actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.popup-content {
  padding: 16px;
}

.popup-title {
  font-size: 16px;
  font-weight: 600;
  text-align: center;
  margin-bottom: 12px;
}

.popup-actions {
  margin-top: 16px;
}

.upload-area {
  width: 100px;
  height: 100px;
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

.image-view {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.full-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 8px;
}
</style>
