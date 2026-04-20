<template>
  <view class="container">
    <!-- 扫码按钮 -->
    <view class="scan-section">
      <button class="btn btn-primary scan-btn" @tap="handleScan">
        <text class="scan-icon">📷</text>
        <text>点击扫描二维码</text>
      </button>
    </view>

    <!-- 解析结果预览 -->
    <view v-if="parsedData" class="preview-card card">
      <view class="card-header">
        <text class="card-title">入库信息预览</text>
      </view>
      
      <view class="info-row">
        <text class="info-label">批次号：</text>
        <text class="info-value">{{ parsedData.batchNo }}</text>
      </view>
      
      <view class="info-row">
        <text class="info-label">包号：</text>
        <text class="info-value">{{ parsedData.packageNo }}</text>
      </view>
      
      <view class="info-row">
        <text class="info-label">原材料型号：</text>
        <text class="info-value">{{ parsedData.model }}</text>
      </view>
      
      <view class="info-row">
        <text class="info-label">生产日期：</text>
        <text class="info-value">{{ parsedData.productionDate }}</text>
      </view>
      
      <view class="info-row">
        <text class="info-label">重量：</text>
        <text class="info-value">{{ parsedData.weight }} {{ parsedData.unit }}</text>
      </view>

      <view class="divider"></view>

      <view class="action-buttons">
        <button class="btn btn-success" @tap="confirmIn">确认入库</button>
        <button class="btn btn-secondary" @tap="cancelScan">取消</button>
      </view>
    </view>

    <!-- 使用说明 -->
    <view v-else class="tips-card card">
      <view class="tips-header">
        <text class="tips-icon">💡</text>
        <text class="tips-title">使用说明</text>
      </view>
      <view class="tips-content">
        <text class="tips-item">1. 点击上方按钮扫描二维码</text>
        <text class="tips-item">2. 系统自动解析物料信息</text>
        <text class="tips-item">3. 确认信息无误后点击确认入库</text>
        <text class="tips-item">4. 入库成功后可在操作记录中查看</text>
      </view>
    </view>

    <!-- 最近入库记录 -->
    <view v-if="recentRecords.length > 0" class="recent-section">
      <view class="section-header">
        <text class="section-title">最近入库</text>
      </view>
      <view 
        v-for="record in recentRecords" 
        :key="record.id"
        class="record-item list-item"
      >
        <view class="record-header">
          <text class="record-batch">{{ record.batch_no }} - {{ record.package_no }}</text>
          <text class="record-time">{{ formatTime(record.created_at) }}</text>
        </view>
        <view class="record-info">
          <text class="record-model">{{ record.model }}</text>
          <text class="record-weight">{{ record.weight }}{{ record.unit }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { parseQRCode, showToast, showLoading, hideLoading, type ParsedQRCode } from '../../utils/common'
import { scanIn, getCurrentUser, saveLocalRecord } from '../../api/index'

const parsedData = ref<ParsedQRCode | null>(null)
const recentRecords = ref<any[]>([])
const currentUser = ref<any>(null)

onMounted(async () => {
  currentUser.value = await getCurrentUser()
  loadRecentRecords()
})

function handleScan() {
  uni.scanCode({
    success: (res) => {
      const qrCode = res.result
      const parsed = parseQRCode(qrCode)
      
      if (!parsed) {
        showToast('二维码格式不正确，请重新扫描', 'error')
        return
      }
      
      parsedData.value = parsed
    },
    fail: (error) => {
      console.error('扫码失败:', error)
      showToast('扫码失败，请重试', 'error')
    }
  })
}

async function confirmIn() {
  if (!parsedData.value || !currentUser.value) {
    showToast('数据异常，请重新扫描', 'error')
    return
  }

  try {
    showLoading('入库中...')
    
    await scanIn({
      qr_code: parsedData.value.rawString,
      batch_no: parsedData.value.batchNo,
      package_no: parsedData.value.packageNo,
      model: parsedData.value.model,
      production_date: parsedData.value.productionDate,
      weight: parsedData.value.weight,
      unit: parsedData.value.unit,
      operator: currentUser.value.name
    })

    // 保存本地记录
    saveLocalRecord({
      qr_code: parsedData.value.rawString,
      operation_type: 'IN',
      operator: currentUser.value.name,
      operate_time: new Date().toISOString(),
      detail: `入库：批次${parsedData.value.batchNo}，包号${parsedData.value.packageNo}`,
      ip: null
    })

    showToast('入库成功', 'success')
    parsedData.value = null
    loadRecentRecords()
  } catch (error: any) {
    showToast(error.message || '入库失败', 'error')
  } finally {
    hideLoading()
  }
}

function cancelScan() {
  parsedData.value = null
}

function loadRecentRecords() {
  // 从本地存储加载最近的入库记录
  try {
    const records = uni.getStorageSync('operation_records') || []
    recentRecords.value = records
      .filter((r: any) => r.operation_type === 'IN')
      .slice(0, 5)
  } catch (error) {
    console.error('加载记录失败:', error)
  }
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  if (diff < 60000) {
    return '刚刚'
  } else if (diff < 3600000) {
    return `${Math.floor(diff / 60000)}分钟前`
  } else if (diff < 86400000) {
    return `${Math.floor(diff / 3600000)}小时前`
  } else {
    return `${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
  }
}
</script>

<style scoped>
.scan-section {
  margin-bottom: 30rpx;
}

.scan-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20rpx;
  padding: 60rpx 40rpx;
  font-size: 32rpx;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
}

.scan-icon {
  font-size: 80rpx;
}

.preview-card {
  margin-bottom: 30rpx;
}

.card-header {
  margin-bottom: 30rpx;
}

.card-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #1f2937;
}

.info-row {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
}

.info-label {
  font-size: 28rpx;
  color: #6b7280;
  width: 180rpx;
}

.info-value {
  font-size: 28rpx;
  color: #1f2937;
  font-weight: 500;
  flex: 1;
}

.action-buttons {
  display: flex;
  gap: 20rpx;
  margin-top: 30rpx;
}

.action-buttons .btn {
  flex: 1;
}

.tips-card {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
}

.tips-header {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 20rpx;
}

.tips-icon {
  font-size: 36rpx;
}

.tips-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #92400e;
}

.tips-content {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.tips-item {
  font-size: 26rpx;
  color: #78350f;
  line-height: 1.6;
}

.recent-section {
  margin-top: 40rpx;
}

.section-header {
  margin-bottom: 20rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #1f2937;
}

.record-item {
  margin-bottom: 20rpx;
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12rpx;
}

.record-batch {
  font-size: 28rpx;
  font-weight: 600;
  color: #1f2937;
}

.record-time {
  font-size: 24rpx;
  color: #9ca3af;
}

.record-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.record-model {
  font-size: 26rpx;
  color: #6b7280;
}

.record-weight {
  font-size: 26rpx;
  color: #3b82f6;
  font-weight: 500;
}
</style>
