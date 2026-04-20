import { toast } from 'sonner';

/**
 * 触发对焦（多种方法尝试）
 * @param videoTrack 视频轨道
 * @param capabilities 摄像头能力
 * @param imageCapture ImageCapture对象
 */
async function triggerFocus(videoTrack: MediaStreamTrack, capabilities: any, imageCapture: any): Promise<boolean> {
  let focusSuccess = false;
  
  try {
    // 方法1: 使用ImageCapture API
    if (imageCapture && !focusSuccess) {
      try {
        const photoCapabilities = await imageCapture.getPhotoCapabilities();
        if (photoCapabilities.focusMode && photoCapabilities.focusMode.includes('single-shot')) {
          await imageCapture.takePhoto({ focusMode: 'single-shot' });
          console.log('✅ ImageCapture对焦成功');
          focusSuccess = true;
          return true;
        }
      } catch (e) {
        console.log('❌ ImageCapture对焦失败:', e);
      }
    }
    
    // 方法2: 使用MediaStreamTrack切换对焦模式
    if (!focusSuccess && 'focusMode' in capabilities) {
      const focusModes = (capabilities as any).focusMode;
      
      if (Array.isArray(focusModes) && focusModes.includes('single-shot')) {
        // 先切换到manual，再切换回single-shot
        if (focusModes.includes('manual')) {
          await videoTrack.applyConstraints({
            advanced: [{ focusMode: 'manual' } as any]
          });
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // 触发单次对焦
        await videoTrack.applyConstraints({
          advanced: [{ focusMode: 'single-shot' } as any]
        });
        console.log('✅ MediaStreamTrack对焦成功');
        focusSuccess = true;
        
        // 500ms后恢复连续对焦模式
        setTimeout(async () => {
          try {
            if (focusModes.includes('continuous')) {
              await videoTrack.applyConstraints({
                advanced: [{ focusMode: 'continuous' } as any]
              });
              console.log('已恢复连续对焦模式');
            }
          } catch (e) {
            console.log('恢复连续对焦失败:', e);
          }
        }, 500);
        
        return true;
      }
    }
    
    // 方法3: 尝试调整焦距
    if (!focusSuccess && 'focusDistance' in capabilities) {
      const focusDistance = (capabilities as any).focusDistance;
      if (focusDistance && focusDistance.min !== undefined && focusDistance.max !== undefined) {
        const currentSettings = videoTrack.getSettings();
        const currentDistance = (currentSettings as any).focusDistance || focusDistance.min;
        const newDistance = currentDistance === focusDistance.min ? focusDistance.max : focusDistance.min;
        
        await videoTrack.applyConstraints({
          advanced: [{ focusDistance: newDistance } as any]
        });
        console.log('✅ 焦距调整成功:', newDistance);
        focusSuccess = true;
        return true;
      }
    }
  } catch (e) {
    console.error('对焦失败:', e);
  }
  
  return focusSuccess;
}

/**
 * 设置摄像头自动对焦
 * @param videoElement video元素
 * @param videoTrack 视频轨道
 */
export async function setupCameraFocus(videoElement: HTMLVideoElement, videoTrack: MediaStreamTrack) {
  try {
    const capabilities = videoTrack.getCapabilities();
    const settings = videoTrack.getSettings();
    console.log('=== 摄像头详细信息 ===');
    console.log('摄像头能力(capabilities):', JSON.stringify(capabilities, null, 2));
    console.log('当前设置(settings):', JSON.stringify(settings, null, 2));
    console.log('=====================');
    
    const constraints: any = { advanced: [] };
    
    // 尝试启用连续自动对焦
    if ('focusMode' in capabilities) {
      const focusModes = (capabilities as any).focusMode;
      console.log('支持的对焦模式:', focusModes);
      
      if (Array.isArray(focusModes)) {
        if (focusModes.includes('continuous')) {
          constraints.advanced.push({ focusMode: 'continuous' });
        } else if (focusModes.includes('single-shot')) {
          constraints.advanced.push({ focusMode: 'single-shot' });
        }
      }
    }
    
    // 尝试设置焦距为近距离（适合扫二维码）
    if ('focusDistance' in capabilities) {
      const focusDistance = (capabilities as any).focusDistance;
      console.log('焦距范围:', focusDistance);
      if (focusDistance && focusDistance.min !== undefined) {
        constraints.advanced.push({ 
          focusDistance: focusDistance.min 
        });
      }
    }
    
    if (constraints.advanced.length > 0) {
      await videoTrack.applyConstraints(constraints);
      console.log('✅ 自动对焦已启用:', constraints);
    } else {
      console.log('⚠️ 设备不支持自动对焦');
    }
    
    // 尝试创建ImageCapture对象用于对焦
    let imageCapture: any = null;
    try {
      // @ts-ignore - ImageCapture可能不在所有浏览器中可用
      if (typeof ImageCapture !== 'undefined') {
        // @ts-ignore
        imageCapture = new ImageCapture(videoTrack);
        console.log('✅ ImageCapture API 可用');
        
        // 获取照片能力
        const photoCapabilities = await imageCapture.getPhotoCapabilities();
        console.log('照片能力:', JSON.stringify(photoCapabilities, null, 2));
      }
    } catch (e) {
      console.log('❌ ImageCapture API 不可用:', e);
    }
    
    // 启动后立即尝试对焦一次
    console.log('🎯 启动后立即尝试对焦...');
    const initialFocusSuccess = await triggerFocus(videoTrack, capabilities, imageCapture);
    if (initialFocusSuccess) {
      console.log('✅ 初始对焦成功');
    } else {
      console.log('⚠️ 初始对焦失败，请点击屏幕手动对焦');
    }
    
    // 添加点击对焦功能
    let isProcessingFocus = false;
    videoElement.addEventListener('click', async () => {
      if (isProcessingFocus) {
        console.log('⏳ 对焦处理中，请稍候...');
        return;
      }
      
      isProcessingFocus = true;
      console.log('=== 👆 用户点击触发对焦 ===');
      
      const success = await triggerFocus(videoTrack, capabilities, imageCapture);
      
      if (success) {
        toast.success('✅ 对焦成功', { duration: 1500 });
        // 触觉反馈（如果支持）
        if ('vibrate' in navigator) {
          navigator.vibrate(50);
        }
      } else {
        console.log('⚠️ 所有对焦方法都失败了');
        console.log('💡 建议：手动调整手机与二维码的距离（2-10厘米）');
        toast.info('请手动调整距离（2-10cm）', { duration: 2000 });
      }
      
      console.log('===================');
      
      // 1秒后允许再次对焦
      setTimeout(() => {
        isProcessingFocus = false;
      }, 1000);
    });
    
    // 每3秒自动尝试对焦一次（帮助保持清晰）
    const autoFocusInterval = setInterval(async () => {
      if (!isProcessingFocus) {
        console.log('🔄 自动对焦...');
        await triggerFocus(videoTrack, capabilities, imageCapture);
      }
    }, 3000);
    
    // 保存interval ID以便清理
    (videoElement as any).__autoFocusInterval = autoFocusInterval;
    
  } catch (error) {
    console.log('❌ 自动对焦设置失败:', error);
  }
}

/**
 * 清理对焦相关资源
 * @param videoElement video元素
 */
export function cleanupCameraFocus(videoElement: HTMLVideoElement | null) {
  if (videoElement && (videoElement as any).__autoFocusInterval) {
    clearInterval((videoElement as any).__autoFocusInterval);
    (videoElement as any).__autoFocusInterval = null;
    console.log('✅ 已清理自动对焦定时器');
  }
}
