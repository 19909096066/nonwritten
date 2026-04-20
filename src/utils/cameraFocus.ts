import { toast } from 'sonner';

/**
 * 摄像头能力类型定义
 */
interface CameraCapabilities {
  focusMode?: ('continuous' | 'manual' | 'single-shot')[];
  focusDistance?: { min: number; max: number };
  exposureMode?: ('auto' | 'manual')[];
  whiteBalanceMode?: ('auto' | 'manual')[];
}

interface ImageCapturePhotoCapabilities {
  focusMode?: ('continuous' | 'manual' | 'single-shot')[];
  fillLightMode?: ('auto' | 'off' | 'flash')[];
}

/**
 * 触发对焦（多种方法尝试）
 * @param videoTrack 视频轨道
 * @param capabilities 摄像头能力
 * @param imageCapture ImageCapture对象
 */
export async function triggerFocus(
  videoTrack: MediaStreamTrack,
  capabilities: CameraCapabilities,
  imageCapture: ImageCapture | null
): Promise<boolean> {
  let focusSuccess = false;

  try {
    // 方法1: 使用ImageCapture API
    if (imageCapture && !focusSuccess) {
      try {
        const photoCapabilities: ImageCapturePhotoCapabilities =
          await imageCapture.getPhotoCapabilities();

        if (
          photoCapabilities.focusMode &&
          photoCapabilities.focusMode.includes('single-shot')
        ) {
          await imageCapture.takePhoto({ focusMode: 'single-shot' } as any);
          console.log('✅ ImageCapture对焦成功');
          focusSuccess = true;
          return true;
        }
      } catch (e) {
        console.log('❌ ImageCapture对焦失败:', e);
      }
    }

    // 方法2: 使用MediaStreamTrack切换对焦模式
    if (!focusSuccess && capabilities.focusMode) {
      const focusModes = capabilities.focusMode;

      if (Array.isArray(focusModes) && focusModes.includes('single-shot')) {
        // 先切换到manual，再切换回single-shot
        if (focusModes.includes('manual')) {
          await videoTrack.applyConstraints({
            advanced: [{ focusMode: 'manual' }] as any,
          });
          await new Promise((resolve) => setTimeout(resolve, 100));
        }

        // 触发单次对焦
        await videoTrack.applyConstraints({
          advanced: [{ focusMode: 'single-shot' }] as any,
        });
        console.log('✅ MediaStreamTrack对焦成功');
        focusSuccess = true;

        // 500ms后恢复连续对焦模式
        setTimeout(async () => {
          try {
            if (focusModes.includes('continuous')) {
              await videoTrack.applyConstraints({
                advanced: [{ focusMode: 'continuous' }] as any,
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
    if (!focusSuccess && capabilities.focusDistance) {
      const focusDistance = capabilities.focusDistance;
      if (
        focusDistance.min !== undefined &&
        focusDistance.max !== undefined
      ) {
        const currentSettings = videoTrack.getSettings() as CameraCapabilities;
        const currentDistance =
          currentSettings.focusDistance || focusDistance.min;
        const newDistance =
          currentDistance === focusDistance.min
            ? focusDistance.max
            : focusDistance.min;

        await videoTrack.applyConstraints({
          advanced: [{ focusDistance: newDistance }] as any,
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
 * 自动对焦定时器
 */
let autoFocusInterval: NodeJS.Timeout | null = null;

/**
 * 设置摄像头自动对焦
 * @param videoElement video元素
 * @param videoTrack 视频轨道
 */
export async function setupCameraFocus(
  videoElement: HTMLVideoElement,
  videoTrack: MediaStreamTrack
) {
  try {
    const capabilities = videoTrack.getCapabilities() as CameraCapabilities;
    const settings = videoTrack.getSettings() as CameraCapabilities;

    if (import.meta.env.DEV) {
      console.log('=== 摄像头详细信息 ===');
      console.log('摄像头能力(capabilities):', JSON.stringify(capabilities, null, 2));
      console.log('当前设置(settings):', JSON.stringify(settings, null, 2));
    }

    // 检查是否支持对焦
    const supportsFocus =
      capabilities.focusMode && capabilities.focusMode.length > 0;

    if (!supportsFocus) {
      console.log('摄像头不支持对焦');
      return;
    }

    // 创建 ImageCapture 对象
    let imageCapture: ImageCapture | null = null;
    if ('ImageCapture' in window) {
      try {
        const stream = videoElement.srcObject as MediaStream;
        const videoTracks = stream.getVideoTracks();
        if (videoTracks.length > 0) {
          imageCapture = new ImageCapture(videoTracks[0]);
        }
      } catch (e) {
        console.log('创建ImageCapture失败:', e);
      }
    }

    let isProcessingFocus = false;

    // 立即执行一次对焦
    await triggerFocus(videoTrack, capabilities, imageCapture);

    // 每3秒自动对焦一次
    autoFocusInterval = setInterval(async () => {
      if (!isProcessingFocus) {
        isProcessingFocus = true;

        if (import.meta.env.DEV) {
          console.log('🔄 自动对焦...');
        }

        await triggerFocus(videoTrack, capabilities, imageCapture);

        isProcessingFocus = false;
      }
    }, 3000);

    // 保存到 video 元素上，方便清理
    (videoElement as any).__autoFocusInterval = autoFocusInterval;

    if (import.meta.env.DEV) {
      console.log('✅ 自动对焦已启用');
    }
  } catch (error) {
    console.error('设置自动对焦失败:', error);
    toast.error('摄像头设置失败，请检查设备兼容性');
  }
}

/**
 * 清理摄像头对焦
 * @param videoElement video元素
 */
export function cleanupCameraFocus(videoElement: HTMLVideoElement) {
  // 清理自动对焦定时器
  if ((videoElement as any).__autoFocusInterval) {
    clearInterval((videoElement as any).__autoFocusInterval);
    (videoElement as any).__autoFocusInterval = null;
  }

  if (import.meta.env.DEV) {
    console.log('✅ 自动对焦已清理');
  }
}
