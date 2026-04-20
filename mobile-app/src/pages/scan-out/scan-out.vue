<template>
  <view class="container">
    <!-- 扫码按钮 -->
    <view class="scan-section">
      <button class="btn btn-success scan-btn" @tap="handleScan">
        <text class="scan-icon">📷</text>
        <text>点击扫描二维码</text>
      </button>
    </view>

    <!-- 物料信息 -->
    <view v-if="materialInfo" class="material-card card">
      <view class="card-header">
        <text class="card-title">物料信息</text>
        <view 
          :class="['status-badge', materialInfo.status === 0 ? 'status-in-stock' : 'status-out-stock']"
        >
          {{ materialInfo.status === 0 ? '在库' : '已出库' }}
        </view>
      </view>
      
      <view class="info-row">
        <text class="info-label">批次号：</text>
        <text class="info-value">{{ materialInfo.batch_no }}</text>
      </view>
      
      <view class="info-row">
        <text class="info-label">包号：</text>
        <text class="info-value">{{ materialInfo.package_no }}</text>
      </view>
      
      <view class="info-row">
        <text class="info-label">原材料型号：</text>
        <text class="info-value">{{ materialInfo.model }}</text>
      </view>
      
      <view class="info-row">
        <text class="info-label">生产日期：</text>
        <text class="info-value">{{ materialInfo.production_date }}</text>
      </view>
      
      <view class="info-row">
        <text class="info-label">重量：</text>
        <text class="info-value">{{ materialInfo.weight }} {{ materialInfo.unit }}</text>
      </view>

      <view class="divider"></view>

      <view v-if="materialInfo.status === 0" class="action-buttons">
        <button class="btn btn-success" @tap="confirmOut">确认出库</button>
        <button class="btn btn-secondary" @tap="cancelScan">取消</button>
      </view>
      <view v-else class="out-info">
        <text class="out-time">出库时间：{{ formatDateTime(materialInfo.out_at) }}</text>
        <text class="out-operator">操作人：{{ materialInfo.operator }}</text>
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
        <text class="tips-item">2. 系统自动查询物料状态</text>
        <text class="tips-item">3. 确认物料在库后点击确认出库</text>
        <text class="tips-item">4. 出库成功后可在操作记录中查看</text>
      </view>
    </view>

    <!-- 最近出库记录 -->
    <view v-if="recentRecords.length > 0" class="recent-section">
      <view class="section-header">
        <text class="section-title">最近出库</text>
      </view>
      <view 
        v-for="record in recentRecords" 
        :key="record.id"
        class="record-item list-item"
      >
        <view class="record-header">
          <text class="record-batch">{{ record.detail }}</text>
          <text class="record-time">{{ formatTime(record.operate_time) }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { showToast, showLoading, hideLoading, formatDateTime } from '../../utils/common'
import { queryByQRCode, scanOut, getCurrentUser, saveLocalRecord, type RawMaterial } from '../../api/index'

const materialInfo = ref<RawMaterial | null>(null)
const recentRecords = ref<any[]>([])
const currentUser = ref<any>(null)

onMounted(async () => {
  currentUser.value = await getCurrentUser()
  loadRecentRecords()
})

function handleScan() {
  uni.scanCode({
    success: async (res) => {
      const qrCode = res.result
      
      try {
        showLoading('查询中...')
        const material = await queryByQRCode(qrCode)
        
        if (!material) {
          showToast('未找到该物料信息', 'error')
          return
        }
        
        materialInfo.value = material
      } catch (error: any) {
        showToast(error.message || '查询失败', 'error')
      } finally {
        hideLoading()
      }
    },
    fail: (error) => {
      console.error('扫码失败:', error)
      showToast('扫码失败，请重试', 'error')
    }
  })
}

async function confirmOut() {
  if (!materialInfo.value || !currentUser.value) {
    showToast('数据异常，请重新扫描', 'error')
    return
  }

  if (materialInfo.value.status === 1) {
    showToast('该物料已出库，无法重复出库', 'error')
    return
  }

  try {
    showLoading('出库中...')
    
    await scanOut(materialInfo.value.qr_code, currentUser.value.name)

    // 保存本地记录
    saveLocalRecord({
      qr_code: materialInfo.value.qr_code,
      operation_type: 'OUT',
      operator: currentUser.value.name,
      operate_time: new Date().toISOString(),
      detail: `出库：批次${materialInfo.value.batch_no}，包号${materialInfo.value.package_no}`,
      ip: null
    })

    showToast('出库成功', 'success')
    materialInfo.value = null
    loadRecentRecords()
  } catch (error: any) {
    showToast(error.message || '出库失败', 'error')
  } finally {
    hideLoading()
  }
}

function cancelScan() {
  materialInfo.value = null
}

function loadRecentRecords() {
  try {
    const records = uni.getStorageSync('operation_records') || []
    recentRecords.value = records
      .filter((r: any) => r.operation_type === 'OUT')
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
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.scan-icon {
  font-size: 80rpx;
}

.material-card {
  margin-bottom: 30rpx;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
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

.out-info {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  margin-top: 20rpx;
  padding: 20rpx;
  background-color: #f3f4f6;
  border-radius: 12rpx;
}

.out-time,
.out-operator {
  font-size: 26rpx;
  color: #6b7280;
}

.tips-card {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
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
  color: #065f46;
}

.tips-content {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.tips-item {
  font-size: 26rpx;
  color: #047857;
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
}

.record-batch {
  font-size: 28rpx;
  color: #1f2937;
  flex: 1;
}

.record-time {
  font-size: 24rpx;
  color: #9ca3af;
}
</style>
