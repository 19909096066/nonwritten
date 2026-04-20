import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../utils/common'

// 创建Supabase客户端
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// 用户相关类型
export interface User {
  id: string
  phone: string
  name: string
  role: 'admin' | 'user'
  app_permissions: {
    scan_in: boolean
    scan_out: boolean
    scan_query: boolean
    manual_query: boolean
    view_records: boolean
  }
  web_permissions: Record<string, boolean>
  created_at: string
  last_login: string | null
}

// 原材料类型
export interface RawMaterial {
  id: string
  qr_code: string
  batch_no: string
  package_no: string
  model: string
  production_date: string
  weight: number
  unit: string
  status: 0 | 1 // 0-在库，1-已出库
  created_at: string
  out_at: string | null
  operator: string
  remark: string | null
}

// 操作日志类型
export interface OperationLog {
  id: string
  qr_code: string | null
  operation_type: string
  operator: string
  operate_time: string
  detail: string
  ip: string | null
}

/**
 * 用户登录
 */
export async function login(phone: string, password: string) {
  // 将手机号转换为email格式（与Web后台保持一致）
  const email = `${phone}@nonwoven.local`
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (error) {
    throw error
  }

  // 更新最后登录时间
  if (data.user) {
    await supabase
      .from('profiles')
      .update({ last_login: new Date().toISOString() })
      .eq('id', data.user.id)
  }

  return data
}

/**
 * 用户登出
 */
export async function logout() {
  const { error } = await supabase.auth.signOut()
  if (error) {
    throw error
  }
}

/**
 * 获取当前用户信息
 */
export async function getCurrentUser(): Promise<User | null> {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return null
  }

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  if (error || !data) {
    return null
  }

  return data as User
}

/**
 * 扫码入库
 */
export async function scanIn(materialData: {
  qr_code: string
  batch_no: string
  package_no: string
  model: string
  production_date: string
  weight: number
  unit: string
  operator: string
}) {
  // 检查二维码是否已存在
  const { data: existing } = await supabase
    .from('raw_materials')
    .select('id')
    .eq('qr_code', materialData.qr_code)
    .maybeSingle()

  if (existing) {
    throw new Error('该二维码已入库，请勿重复操作')
  }

  // 插入原材料记录
  const { data, error } = await supabase
    .from('raw_materials')
    .insert({
      ...materialData,
      status: 0,
      created_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) {
    throw error
  }

  // 记录操作日志
  await supabase.from('operation_logs').insert({
    qr_code: materialData.qr_code,
    operation_type: 'IN',
    operator: materialData.operator,
    operate_time: new Date().toISOString(),
    detail: `入库：批次${materialData.batch_no}，包号${materialData.package_no}`
  })

  return data
}

/**
 * 扫码出库
 */
export async function scanOut(qrCode: string, operator: string) {
  // 查询物料信息
  const { data: material, error: queryError } = await supabase
    .from('raw_materials')
    .select('*')
    .eq('qr_code', qrCode)
    .maybeSingle()

  if (queryError) {
    throw queryError
  }

  if (!material) {
    throw new Error('未找到该二维码对应的物料')
  }

  if (material.status === 1) {
    throw new Error('该物料已出库，无法重复出库')
  }

  // 更新状态为已出库
  const { data, error } = await supabase
    .from('raw_materials')
    .update({
      status: 1,
      out_at: new Date().toISOString(),
      operator
    })
    .eq('qr_code', qrCode)
    .select()
    .single()

  if (error) {
    throw error
  }

  // 记录操作日志
  await supabase.from('operation_logs').insert({
    qr_code: qrCode,
    operation_type: 'OUT',
    operator,
    operate_time: new Date().toISOString(),
    detail: `出库：批次${material.batch_no}，包号${material.package_no}`
  })

  return data
}

/**
 * 查询物料详情（通过二维码）
 */
export async function queryByQRCode(qrCode: string): Promise<RawMaterial | null> {
  const { data, error } = await supabase
    .from('raw_materials')
    .select('*')
    .eq('qr_code', qrCode)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data as RawMaterial | null
}

/**
 * 手动查询（通过批次号或型号）
 */
export async function manualQuery(searchType: 'batch' | 'model', searchValue: string) {
  const column = searchType === 'batch' ? 'batch_no' : 'model'
  
  const { data, error } = await supabase
    .from('raw_materials')
    .select('*')
    .eq(column, searchValue)
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  // 计算汇总数据
  const inStockItems = (data || []).filter(item => item.status === 0)
  const totalCount = inStockItems.length
  const totalWeight = inStockItems.reduce((sum, item) => sum + item.weight, 0)

  return {
    summary: {
      totalCount,
      totalWeight
    },
    details: data || []
  }
}

/**
 * 获取本地操作记录
 */
export function getLocalRecords(): OperationLog[] {
  try {
    const records = uni.getStorageSync('operation_records') || []
    return records.slice(0, 20) // 只返回最近20条
  } catch (error) {
    console.error('获取本地记录失败:', error)
    return []
  }
}

/**
 * 保存本地操作记录
 */
export function saveLocalRecord(record: Omit<OperationLog, 'id'>) {
  try {
    const records = getLocalRecords()
    const newRecord = {
      ...record,
      id: Date.now().toString()
    }
    records.unshift(newRecord)
    
    // 只保留最近20条
    const limitedRecords = records.slice(0, 20)
    uni.setStorageSync('operation_records', limitedRecords)
  } catch (error) {
    console.error('保存本地记录失败:', error)
  }
}

/**
 * 清空本地操作记录
 */
export function clearLocalRecords() {
  try {
    uni.removeStorageSync('operation_records')
  } catch (error) {
    console.error('清空本地记录失败:', error)
  }
}
