<template>
  <view class="container">
    <!-- 查询表单 -->
    <view class="search-card card">
      <view class="search-type">
        <view 
          :class="['type-btn', searchType === 'batch' ? 'type-btn-active' : '']"
          @tap="searchType = 'batch'"
        >
          按批次号
        </view>
        <view 
          :class="['type-btn', searchType === 'model' ? 'type-btn-active' : '']"
          @tap="searchType = 'model'"
        >
          按型号
        </view>
      </view>

      <view class="search-input-wrapper">
        <input 
          class="input search-input" 
          :placeholder="searchType === 'batch' ? '请输入批次号' : '请输入原材料型号'"
          v-model="searchValue"
          @confirm="handleSearch"
        />
        <button class="btn btn-primary search-btn" @tap="handleSearch">查询</button>
      </view>
    </view>

    <!-- 汇总信息 -->
    <view v-if="summary" class="summary-card card">
      <view class="summary-header">
        <text class="summary-title">在库汇总</text>
      </view>
      
      <view class="summary-grid">
        <view class="summary-item">
          <text class="summary-label">总卷数</text>
          <text class="summary-value">{{ summary.totalCount }}</text>
          <text class="summary-unit">卷</text>
        </view>
        
        <view class="summary-divider"></view>
        
        <view class="summary-item">
          <text class="summary-label">总重量</text>
          <text class="summary-value">{{ summary.totalWeight.toFixed(2) }}</text>
          <text class="summary-unit">kg</text>
        </view>
      </view>
    </view>

    <!-- 明细列表 -->
    <view v-if="details.length > 0" class="details-section">
      <view class="section-header">
        <text class="section-title">物料明细</text>
        <text class="section-count">共 {{ details.length }} 条</text>
      </view>
      
      <view 
        v-for="item in details" 
        :key="item.id"
        class="detail-item list-item"
      >
        <view class="detail-header">
          <text class="detail-batch">{{ item.batch_no }} - {{ item.package_no }}</text>
          <view 
            :class="['status-badge', item.status === 0 ? 'status-in-stock' : 'status-out-stock']"
          >
            {{ item.status === 0 ? '在库' : '已出库' }}
          </view>
        </view>
        
        <view class="detail-info">
          <view class="detail-row">
            <text class="detail-label">型号：</text>
            <text class="detail-value">{{ item.model }}</text>
          </view>
          <view class="detail-row">
            <text class="detail-label">生产日期：</text>
            <text class="detail-value">{{ item.production_date }}</text>
          </view>
          <view class="detail-row">
            <text class="detail-label">重量：</text>
            <text class="detail-value text-primary">{{ item.weight }} {{ item.unit }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 空状态 -->
    <view v-if="searched && details.length === 0" class="empty-state">
      <text class="empty-icon">📦</text>
      <text class="empty-text">暂无数据</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onLoad } from 'vue'
import { showToast, showLoading, hideLoading } from '../../utils/common'
import { manualQuery, type RawMaterial } from '../../api/index'

const searchType = ref<'batch' | 'model'>('batch')
const searchValue = ref('')
const summary = ref<{ totalCount: number; totalWeight: number } | null>(null)
const details = ref<RawMaterial[]>([])
const searched = ref(false)

// 支持从其他页面跳转并自动查询
onLoad((options: any) => {
  if (options.type && options.value) {
    searchType.value = options.type
    searchValue.value = options.value
    handleSearch()
  }
})

async function handleSearch() {
  if (!searchValue.value.trim()) {
    showToast('请输入查询内容', 'none')
    return
  }

  try {
    showLoading('查询中...')
    searched.value = true
    
    const result = await manualQuery(searchType.value, searchValue.value.trim())
    
    summary.value = result.summary
    details.value = result.details
    
    if (result.details.length === 0) {
      showToast('未找到相关数据', 'none')
    }
  } catch (error: any) {
    showToast(error.message || '查询失败', 'error')
  } finally {
    hideLoading()
  }
}
</script>

<style scoped>
.search-card {
  margin-bottom: 30rpx;
}

.search-type {
  display: flex;
  gap: 20rpx;
  margin-bottom: 30rpx;
}

.type-btn {
  flex: 1;
  padding: 20rpx;
  text-align: center;
  font-size: 28rpx;
  color: #6b7280;
  background-color: #f3f4f6;
  border-radius: 12rpx;
  transition: all 0.3s;
}

.type-btn-active {
  color: #ffffff;
  background-color: #3b82f6;
  font-weight: 600;
}

.search-input-wrapper {
  display: flex;
  gap: 20rpx;
}

.search-input {
  flex: 1;
}

.search-btn {
  padding: 24rpx 40rpx;
  font-size: 28rpx;
}

.summary-card {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: #ffffff;
  margin-bottom: 30rpx;
}

.summary-header {
  margin-bottom: 30rpx;
}

.summary-title {
  font-size: 30rpx;
  font-weight: 600;
}

.summary-grid {
  display: flex;
  align-items: center;
  justify-content: space-around;
}

.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
}

.summary-label {
  font-size: 26rpx;
  opacity: 0.9;
}

.summary-value {
  font-size: 48rpx;
  font-weight: 700;
}

.summary-unit {
  font-size: 24rpx;
  opacity: 0.8;
}

.summary-divider {
  width: 2rpx;
  height: 80rpx;
  background-color: rgba(255, 255, 255, 0.3);
}

.details-section {
  margin-top: 40rpx;
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

.section-count {
  font-size: 24rpx;
  color: #9ca3af;
}

.detail-item {
  margin-bottom: 20rpx;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.detail-batch {
  font-size: 28rpx;
  font-weight: 600;
  color: #1f2937;
}

.detail-info {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.detail-row {
  display: flex;
  align-items: center;
}

.detail-label {
  font-size: 26rpx;
  color: #6b7280;
  width: 140rpx;
}

.detail-value {
  font-size: 26rpx;
  color: #1f2937;
  flex: 1;
}
</style>
