import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { USE_LOCAL_DB } from '@/db/localApi';
import { authApi as serverAuthApi } from '@/db/serverApi';
import type { Profile } from '@/types';

// 服务器模式下的用户类型
interface ServerUser {
  id: string;
  name: string;
  phone: string;
  role: 'admin' | 'user';
  app_permissions?: Record<string, boolean>;
  web_permissions?: Record<string, boolean>;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  if (USE_LOCAL_DB) {
    // 本地模式：从localStorage获取profile
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const userStr = token.split('local-token-')[1];
        if (userStr) {
          const userData = JSON.parse(userStr);
          return userData as Profile;
        }
      } catch (error) {
        console.error('解析用户数据失败:', error);
      }
    }
    return null;
  }

  // 服务器模式
  try {
    const profile = await serverAuthApi.getProfile();
    return profile as Profile;
  } catch (error) {
    console.error('获取用户信息失败:', error);
    return null;
  }
}

interface AuthContextType {
  user: ServerUser | null;
  profile: Profile | null;
  loading: boolean;
  signInWithPhone: (phone: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ServerUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    if (!user) {
      setProfile(null);
      return;
    }

    const profileData = await getProfile(user.id);
    setProfile(profileData);
  };

  useEffect(() => {
    // 从localStorage加载用户信息
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (token && userStr) {
      try {
        const userData = JSON.parse(userStr);
        setUser(userData as ServerUser);
        setProfile(userData as unknown as Profile);
      } catch (error) {
        console.error('加载用户信息失败:', error);
      }
    }
    setLoading(false);
  }, []);

  const signInWithPhone = async (phone: string, password: string) => {
    try {
      if (USE_LOCAL_DB) {
        // 本地模式登录
        const { loginByPhone } = await import('@/db/localApi');
        const result = await loginByPhone(phone, password);
        if (result.user) {
          localStorage.setItem('token', result.session.access_token);
          localStorage.setItem('user', JSON.stringify(result.user));
          setUser(result.user as unknown as ServerUser);
          setProfile(result.user as unknown as Profile);
        }
        return { error: null };
      }

      // 服务器模式登录
      const data = await serverAuthApi.login(phone, password);
      if (data.user) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user as ServerUser);
        setProfile(data.user as unknown as Profile);
      }
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    // 清除本地存储
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setProfile(null);

    if (!USE_LOCAL_DB) {
      // 服务器模式调用登出
      serverAuthApi.logout();
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signInWithPhone, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
