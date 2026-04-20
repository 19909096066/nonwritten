import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signInWithPhone } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: string })?.from || '/';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phone || !password) {
      toast.error('请输入手机号和密码');
      return;
    }

    // 验证手机号格式（11位数字）
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      toast.error('请输入正确的手机号');
      return;
    }

    setLoading(true);
    try {
      const { error } = await signInWithPhone(phone, password);
      if (error) {
        toast.error('登录失败：' + error.message);
      } else {
        toast.success('登录成功');
        navigate(from, { replace: true });
      }
    } catch (error) {
      toast.error('登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/20 to-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">无纺布原材料管理系统</CardTitle>
          <CardDescription className="text-center">
            请使用手机号和密码登录
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">手机号</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="请输入手机号"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={loading}
                autoComplete="tel"
                maxLength={11}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                type="password"
                placeholder="请输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                autoComplete="current-password"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              登录
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-4">
              如需注册新用户，请联系管理员
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
