<template>
  <view class="container">
    <!-- 扫码按钮 -->
    <view class="scan-section">
      <button class="btn btn-warning scan-btn" @tap="handleScan">
        <text class="scan-icon">🔍</text>
        <text>点击扫描二维码</text>
      </button>
    </view>

    <!-- 物料详情 -->
    <view v-if="materialInfo" class="material-card card">
      <view class="card-header">
        <text class="card-title">物料详情</text>
        <view 
          :class="['status-badge', materialInfo.status === 0 ? 'status-in-stock' : 'status-out-stock']"
        >
          {{ materialInfo.status === 0 ? '在库' : '已出库' }}
        </view>
      </view>
      
      <view class="info-section">
        <text class="section-label">基本信息</text>
        
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
      </view>

      <view class="divider"></view>

      <view class="info-section">
        <text class="section-label">操作信息</text>
        
        <view class="info-row">
          <text class="info-label">入库时间：</text>
          <text class="info-value">{{ formatDateTime(materialInfo.created_at) }}</text>
        </view>
        
        <view v-if="materialInfo.status === 1" class="info-row">
          <text class="info-label">出库时间：</text>
          <text class="info-value">{{ formatDateTime(materialInfo.out_at) }}</text>
        </view>
        
        <view class="info-row">
          <text class="info-label">操作人：</text>
          <text class="info-value">{{ materialInfo.operator }}</text>
        </view>
      </view>

      <view class="action-buttons">
        <button class="btn btn-primary" @tap="viewBatchSummary">查看批次汇总</button>
        <button class="btn btn-secondary" @tap="viewModelSummary">查看型号汇总</button>
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
        <text class="tips-item">2. 系统自动显示物料详细信息</text>
        <text class="tips-item">3. 可查看该批次或型号的汇总信息</text>
        <text class="tips-item">4. 支持查看入库、出库等操作记录</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { showToast, showLoading, hideLoading, formatDateTime } from '../../utils/common'
import { queryByQRCode, type RawMaterial } from '../../api/index'

const materialInfo = ref<RawMaterial | null>(null)

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

function viewBatchSummary() {
  if (!materialInfo.value) return
  
  uni.navigateTo({
    url: `/pages/manual-query/manual-query?type=batch&value=${materialInfo.value.batch_no}`
  })
}

function viewModelSummary() {
  if (!materialInfo.value) return
  
  uni.navigateTo({
    url: `/pages/manual-query/manual-query?type=model&value=${materialInfo.value.model}`
  })
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
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
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

.info-section {
  margin-bottom: 20rpx;
}

.section-label {
  display: block;
  font-size: 26rpx;
  color: #9ca3af;
  margin-bottom: 20rpx;
  font-weight: 500;
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
  font-size: 26rpx;
  padding: 20rpx;
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
</style>
