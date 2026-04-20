// Supabase配置
// 使用与Web后台相同的Supabase实例
export const SUPABASE_URL = 'https://backend.appmiaoda.com/projects/supabase283449093093634048'
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoyMDg3MDA2NzMwLCJpc3MiOiJzdXBhYmFzZSIsInJvbGUiOiJhbm9uIiwic3ViIjoiYW5vbiJ9.cdrO9jbyJrTgqRF8Z9DiVtIdUVJQNTx6dnDVMeZoLys'

// 二维码解析规则
// 原始字符串格式：P0126020012-01J1-8~kg~2026-02-04~140.15~B1250050T1
// 解析后字段：
// - 批次号：从段1中提取，规则为从右向左找最后一个-，左侧部分（如P0126020012-01J1）
// - 包号：最后一个-右侧部分（如8）
// - 单位：段2
// - 生产日期：段3
// - 重量：段4（数值）
// - 原材料型号：段5

export interface ParsedQRCode {
  batchNo: string
  packageNo: string
  model: string
  productionDate: string
  weight: number
  unit: string
  rawString: string
}

/**
 * 解析二维码字符串
 * @param qrCode 原始二维码字符串
 * @returns 解析后的数据对象
 */
export function parseQRCode(qrCode: string): ParsedQRCode | null {
  try {
    const parts = qrCode.split('~')
    if (parts.length !== 5) {
      return null
    }

    const [segment1, unit, productionDate, weightStr, model] = parts

    // 解析批次号和包号
    const lastDashIndex = segment1.lastIndexOf('-')
    if (lastDashIndex === -1) {
      return null
    }

    const batchNo = segment1.substring(0, lastDashIndex)
    const packageNo = segment1.substring(lastDashIndex + 1)

    // 解析重量
    const weight = Number.parseFloat(weightStr)
    if (Number.isNaN(weight)) {
      return null
    }

    return {
      batchNo,
      packageNo,
      model,
      productionDate,
      weight,
      unit,
      rawString: qrCode
    }
  } catch (error) {
    console.error('解析二维码失败:', error)
    return null
  }
}

/**
 * 格式化日期
 * @param date 日期字符串或Date对象
 * @returns 格式化后的日期字符串 YYYY-MM-DD
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * 格式化日期时间
 * @param date 日期字符串或Date对象
 * @returns 格式化后的日期时间字符串 YYYY-MM-DD HH:mm:ss
 */
export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const seconds = String(d.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

/**
 * 显示Toast提示
 * @param title 提示内容
 * @param icon 图标类型
 */
export function showToast(title: string, icon: 'success' | 'error' | 'none' = 'none') {
  uni.showToast({
    title,
    icon,
    duration: 2000
  })
}

/**
 * 显示加载提示
 * @param title 提示内容
 */
export function showLoading(title = '加载中...') {
  uni.showLoading({
    title,
    mask: true
  })
}

/**
 * 隐藏加载提示
 */
export function hideLoading() {
  uni.hideLoading()
}

/**
 * 确认对话框
 * @param content 提示内容
 * @param title 标题
 * @returns Promise<boolean>
 */
export function showConfirm(content: string, title = '提示'): Promise<boolean> {
  return new Promise((resolve) => {
    uni.showModal({
      title,
      content,
      success: (res) => {
        resolve(res.confirm)
      },
      fail: () => {
        resolve(false)
      }
    })
  })
}
