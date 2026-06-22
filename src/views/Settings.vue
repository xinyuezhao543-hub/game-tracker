<template>
  <div class="page-container">
    <van-nav-bar title="设置" fixed placeholder />

    <van-cell-group inset title="数据管理" style="margin-top: 12px;">
      <van-cell title="导出数据" is-link @click="exportData" label="导出为JSON文件备份" />
      <van-cell title="导入数据" is-link @click="triggerImport" label="从JSON文件恢复" />
      <van-cell title="清除所有数据" is-link @click="clearAll" label="清除本地所有数据" />
    </van-cell-group>

    <van-cell-group inset title="关于" style="margin-top: 12px;">
      <van-cell title="版本" value="1.0.0" />
      <van-cell title="数据存储" value="本地 localStorage" />
    </van-cell-group>

    <input ref="importInput" type="file" accept=".json" style="display:none;" @change="onImportFile" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { showToast, showConfirmDialog } from 'vant'
import { exportAllData, importAllData, clearAllData } from '../utils/storage'

const importInput = ref(null)

function exportData() {
  const data = exportAllData()
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `game-tracker-backup-${new Date().toISOString().slice(0,10)}.json`
  a.click()
  URL.revokeObjectURL(url)
  showToast('导出成功')
}

function triggerImport() {
  importInput.value?.click()
}

function onImportFile(e) {
  const file = e.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (ev) => {
    try {
      const data = JSON.parse(ev.target.result)
      showConfirmDialog({
        title: '确认导入',
        message: '导入将覆盖当前所有数据，确定继续吗？',
      }).then(() => {
        importAllData(data)
        showToast('导入成功，请刷新页面')
      }).catch(() => {})
    } catch {
      showToast('文件格式错误')
    }
  }
  reader.readAsText(file)
  e.target.value = ''
}

function clearAll() {
  showConfirmDialog({
    title: '确认清除',
    message: '确定要清除所有数据吗？此操作不可恢复！',
  }).then(() => {
    clearAllData()
    showToast('已清除所有数据')
  }).catch(() => {})
}
</script>
