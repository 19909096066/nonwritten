/**
 * 环境变量配置
 * 使用腾讯云服务器 API
 */

export const SERVER_URL = 'http://81.70.90.164/api';

/**
 * 验证环境变量
 */
export function validateEnv(): { valid: boolean; missing: string[] } {
  // 服务器模式下不需要验证 Supabase 配置
  return {
    valid: true,
    missing: [],
  };
}

/**
 * 获取环境配置
 */
export function getEnvConfig() {
  return {
    serverUrl: SERVER_URL,
  };
}

/**
 * 初始化环境变量验证
 */
export function initEnv(): void {
  // 服务器模式下无需额外验证
  console.log('环境初始化完成，使用服务器:', SERVER_URL);
}

/**
 * 获取服务器 URL
 */
export function getServerUrl(): string {
  return SERVER_URL;
}
