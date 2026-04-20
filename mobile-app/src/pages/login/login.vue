<template>
  <view class="login-container">
    <!-- Logo区域 -->
    <view class="logo-section">
      <view class="logo-icon">📦</view>
      <text class="logo-title">原材料管理系统</text>
      <text class="logo-subtitle">Material Management System</text>
    </view>

    <!-- 登录表单 -->
    <view class="login-card card">
      <view class="form-group">
        <text class="label">手机号</text>
        <input 
          class="input" 
          type="number"
          placeholder="请输入手机号"
          v-model="phone"
          maxlength="11"
        />
      </view>

      <view class="form-group">
        <text class="label">密码</text>
        <input 
          class="input" 
          type="password"
          placeholder="请输入密码"
          v-model="password"
          @confirm="handleLogin"
        />
      </view>

      <button class="btn btn-primary login-btn" @tap="handleLogin">
        登录
      </button>
    </view>

    <!-- 底部信息 -->
    <view class="footer">
      <text class="footer-text">© 2026 原材料管理系统</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { login } from '../../api/index'
import { showToast, showLoading, hideLoading } from '../../utils/common'

const phone = ref('')
const password = ref('')

async function handleLogin() {
  // 验证输入
  if (!phone.value.trim()) {
    showToast('请输入手机号', 'none')
    return
  }

  if (!/^1[3-9]\d{9}$/.test(phone.value)) {
    showToast('请输入正确的手机号', 'none')
    return
  }

  if (!password.value.trim()) {
    showToast('请输入密码', 'none')
    return
  }

  try {
    showLoading('登录中...')
    
    await login(phone.value, password.value)
    
    showToast('登录成功', 'success')
    
    // 跳转到首页
    setTimeout(() => {
      uni.reLaunch({
        url: '/pages/index/index'
      })
    }, 1000)
  } catch (error: any) {
    showToast(error.message || '登录失败，请检查手机号和密码', 'error')
  } finally {
    hideLoading()
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 60rpx 30rpx;
  display: flex;
  flex-direction: column;
}

.logo-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 80rpx;
  margin-top: 100rpx;
}

.logo-icon {
  font-size: 120rpx;
  margin-bottom: 30rpx;
}

.logo-title {
  font-size: 40rpx;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 12rpx;
}

.logo-subtitle {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.8);
  letter-spacing: 2rpx;
}

.login-card {
  margin-bottom: 40rpx;
}

.form-group {
  margin-bottom: 30rpx;
}

.login-btn {
  margin-top: 40rpx;
  padding: 28rpx;
  font-size: 32rpx;
  font-weight: 600;
}

.footer {
  margin-top: auto;
  text-align: center;
  padding: 40rpx 0;
}

.footer-text {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.7);
}
</style>
