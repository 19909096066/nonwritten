<template>
  <view class="container">
    <!-- 欢迎信息 -->
    <view class="welcome-card card">
      <view class="welcome-header">
        <text class="welcome-title">欢迎使用</text>
        <text class="welcome-subtitle">原材料管理系统</text>
      </view>
      <view v-if="userInfo" class="user-info">
        <text class="user-name">{{ userInfo.name }}</text>
        <text class="user-role">{{ userInfo.role === 'admin' ? '管理员' : '普通用户' }}</text>
      </view>
    </view>

    <!-- 功能菜单 -->
    <view class="menu-grid">
      <view 
        v-if="hasPermission('scan_in')"
        class="menu-item" 
        @tap="navigateTo('/pages/scan-in/scan-in')"
      >
        <view class="menu-icon" style="background-color: #3b82f6;">
          <text class="icon">📥</text>
        </view>
        <text class="menu-text">扫码入库</text>
      </view>

      <view 
        v-if="hasPermission('scan_out')"
        class="menu-item" 
        @tap="navigateTo('/pages/scan-out/scan-out')"
      >
        <view class="menu-icon" style="background-color: #10b981;">
          <text class="icon">📤</text>
        </view>
        <text class="menu-text">扫码出库</text>
      </view>

      <view 
        v-if="hasPermission('scan_query')"
        class="menu-item" 
        @tap="navigateTo('/pages/scan-query/scan-query')"
      >
        <view class="menu-icon" style="background-color: #f59e0b;">
          <text class="icon">🔍</text>
        </view>
        <text class="menu-text">扫码查询</text>
      </view>

      <view 
        v-if="hasPermission('manual_query')"
        class="menu-item" 
        @tap="navigateTo('/pages/manual-query/manual-query')"
      >
        <view class="menu-icon" style="background-color: #8b5cf6;">
          <text class="icon">📋</text>
        </view>
        <text class="menu-text">手动查询</text>
      </view>

      <view 
        v-if="hasPermission('view_records')"
        class="menu-item" 
        @tap="navigateTo('/pages/records/records')"
      >
        <view class="menu-icon" style="background-color: #ec4899;">
          <text class="icon">📝</text>
        </view>
        <text class="menu-text">操作记录</text>
      </view>
    </view>

    <!-- 退出登录按钮 -->
    <view class="logout-section">
      <button class="btn btn-secondary" @tap="handleLogout">退出登录</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getCurrentUser, logout, type User } from '../../api/index'
import { showToast, showLoading, hideLoading, showConfirm } from '../../utils/common'

const userInfo = ref<User | null>(null)

onMounted(async () => {
  await loadUserInfo()
})

async function loadUserInfo() {
  try {
    showLoading('加载中...')
    const user = await getCurrentUser()
    if (!user) {
      // 未登录，跳转到登录页
      uni.reLaunch({
        url: '/pages/login/login'
      })
      return
    }
    userInfo.value = user
  } catch (error: any) {
    showToast(error.message || '加载用户信息失败', 'error')
  } finally {
    hideLoading()
  }
}

function hasPermission(permission: string): boolean {
  if (!userInfo.value) return false
  if (userInfo.value.role === 'admin') return true
  return userInfo.value.app_permissions?.[permission as keyof typeof userInfo.value.app_permissions] || false
}

function navigateTo(url: string) {
  uni.navigateTo({ url })
}

async function handleLogout() {
  const confirmed = await showConfirm('确定要退出登录吗？')
  if (!confirmed) return

  try {
    showLoading('退出中...')
    await logout()
    showToast('已退出登录', 'success')
    uni.reLaunch({
      url: '/pages/login/login'
    })
  } catch (error: any) {
    showToast(error.message || '退出失败', 'error')
  } finally {
    hideLoading()
  }
}
</script>

<style scoped>
.welcome-card {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: #ffffff;
  margin-bottom: 40rpx;
}

.welcome-header {
  margin-bottom: 20rpx;
}

.welcome-title {
  display: block;
  font-size: 32rpx;
  font-weight: 500;
  margin-bottom: 8rpx;
}

.welcome-subtitle {
  display: block;
  font-size: 40rpx;
  font-weight: 700;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 20rpx;
  margin-top: 30rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid rgba(255, 255, 255, 0.3);
}

.user-name {
  font-size: 28rpx;
  font-weight: 600;
}

.user-role {
  font-size: 24rpx;
  padding: 6rpx 16rpx;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 20rpx;
}

.menu-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 30rpx;
  margin-bottom: 40rpx;
}

.menu-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20rpx;
  padding: 30rpx 20rpx;
  background-color: #ffffff;
  border-radius: 16rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.08);
  transition: all 0.3s;
}

.menu-item:active {
  transform: scale(0.95);
  opacity: 0.8;
}

.menu-icon {
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon {
  font-size: 48rpx;
}

.menu-text {
  font-size: 26rpx;
  color: #374151;
  font-weight: 500;
  text-align: center;
}

.logout-section {
  margin-top: 60rpx;
}
</style>
