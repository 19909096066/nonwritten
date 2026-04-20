<template>
  <view class="container">
    <!-- 操作统计 -->
    <view class="stats-card card">
      <view class="stats-grid">
        <view class="stat-item">
          <text class="stat-value">{{ inCount }}</text>
          <text class="stat-label">入库次数</text>
        </view>
        <view class="stat-divider"></view>
        <view class="stat-item">
          <text class="stat-value">{{ outCount }}</text>
          <text class="stat-label">出库次数</text>
        </view>
      </view>
    </view>

    <!-- 操作记录列表 -->
    <view v-if="records.length > 0" class="records-section">
      <view class="section-header">
        <text class="section-title">操作记录</text>
        <text class="clear-btn" @tap="handleClear">清空</text>
      </view>
      
      <view 
        v-for="record in records" 
        :key="record.id"
        class="record-item list-item"
      >
        <view class="record-header">
          <view class="record-type-wrapper">
            <view 
              :class="['record-type-badge', record.operation_type === 'IN' ? 'type-in' : 'type-out']"
            >
              {{ record.operation_type === 'IN' ? '入库' : '出库' }}
            </view>
            <text class="record-operator">{{ record.operator }}</text>
          </view>
          <text class="record-time">{{ formatTime(record.operate_time) }}</text>
        </view>
        
        <view class="record-detail">
          <text class="detail-text">{{ record.detail }}</text>
        </view>
        
        <view v-if="record.qr_code" class="record-qr">
          <text class="qr-label">二维码：</text>
          <text class="qr-value">{{ record.qr_code }}</text>
        </view>
      </view>
    </view>

    <!-- 空状态 -->
    <view v-else class="empty-state">
      <text class="empty-icon">📝</text>
      <text class="empty-text">暂无操作记录</text>
      <text class="empty-hint">您的出入库操作记录将显示在这里</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getLocalRecords, clearLocalRecords, type OperationLog } from '../../api/index'
import { showConfirm, showToast } from '../../utils/common'

const records = ref<OperationLog[]>([])

const inCount = computed(() => {
  return records.value.filter(r => r.operation_type === 'IN').length
})

const outCount = computed(() => {
  return records.value.filter(r => r.operation_type === 'OUT').length
})

onMounted(() => {
  loadRecords()
})

function loadRecords() {
  records.value = getLocalRecords()
}

async function handleClear() {
  const confirmed = await showConfirm('确定要清空所有本地记录吗？', '提示')
  if (!confirmed) return

  clearLocalRecords()
  records.value = []
  showToast('已清空记录', 'success')
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  
  return `${year}-${month}-${day} ${hours}:${minutes}`
}
</script>

<style scoped>
.stats-card {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  color: #ffffff;
  margin-bottom: 30rpx;
}

.stats-grid {
  display: flex;
  align-items: center;
  justify-content: space-around;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
}

.stat-value {
  font-size: 48rpx;
  font-weight: 700;
}

.stat-label {
  font-size: 26rpx;
  opacity: 0.9;
}

.stat-divider {
  width: 2rpx;
  height: 60rpx;
  background-color: rgba(255, 255, 255, 0.3);
}

.records-section {
  margin-top: 20rpx;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #1f2937;
}

.clear-btn {
  font-size: 26rpx;
  color: #ef4444;
  padding: 8rpx 20rpx;
}

.record-item {
  margin-bottom: 20rpx;
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.record-type-wrapper {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.record-type-badge {
  padding: 6rpx 16rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
  font-weight: 600;
}

.type-in {
  background-color: #dbeafe;
  color: #1e40af;
}

.type-out {
  background-color: #d1fae5;
  color: #065f46;
}

.record-operator {
  font-size: 26rpx;
  color: #6b7280;
}

.record-time {
  font-size: 24rpx;
  color: #9ca3af;
}

.record-detail {
  margin-bottom: 12rpx;
}

.detail-text {
  font-size: 28rpx;
  color: #1f2937;
  line-height: 1.5;
}

.record-qr {
  display: flex;
  align-items: center;
  padding: 12rpx;
  background-color: #f9fafb;
  border-radius: 8rpx;
}

.qr-label {
  font-size: 24rpx;
  color: #9ca3af;
}

.qr-value {
  font-size: 24rpx;
  color: #6b7280;
  flex: 1;
  word-break: break-all;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 120rpx 30rpx;
}

.empty-icon {
  font-size: 120rpx;
  margin-bottom: 20rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #9ca3af;
  margin-bottom: 12rpx;
}

.empty-hint {
  font-size: 24rpx;
  color: #d1d5db;
}
</style>
