-- 创建用户角色枚举
CREATE TYPE public.user_role AS ENUM ('admin', 'user');

-- 创建profiles表
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  phone text,
  name text NOT NULL,
  role public.user_role NOT NULL DEFAULT 'user',
  app_permissions jsonb DEFAULT '{
    "scanIn": false,
    "scanOut": false,
    "scanQuery": false,
    "manualQuery": false,
    "viewRecords": false
  }'::jsonb,
  web_permissions jsonb DEFAULT '{
    "stockView": false,
    "inDetail": false,
    "outDetail": false,
    "batchImport": false,
    "userManage": false,
    "qcPurchase": false,
    "qcProduction": false,
    "qcDefect": false,
    "qcStandard": false,
    "operationLog": false
  }'::jsonb,
  created_at timestamptz DEFAULT now(),
  last_login timestamptz
);

-- 创建触发器函数：首个用户为管理员，后续为普通用户
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_count int;
  extracted_username text;
BEGIN
  SELECT COUNT(*) INTO user_count FROM profiles;
  
  -- 从email中提取username（去掉@miaoda.com）
  extracted_username := REPLACE(NEW.email, '@miaoda.com', '');
  
  -- 插入profile，首个用户为admin并拥有所有权限
  INSERT INTO public.profiles (id, username, name, role, app_permissions, web_permissions)
  VALUES (
    NEW.id,
    extracted_username,
    extracted_username,
    CASE WHEN user_count = 0 THEN 'admin'::public.user_role ELSE 'user'::public.user_role END,
    CASE WHEN user_count = 0 THEN '{
      "scanIn": true,
      "scanOut": true,
      "scanQuery": true,
      "manualQuery": true,
      "viewRecords": true
    }'::jsonb ELSE '{
      "scanIn": false,
      "scanOut": false,
      "scanQuery": false,
      "manualQuery": false,
      "viewRecords": false
    }'::jsonb END,
    CASE WHEN user_count = 0 THEN '{
      "stockView": true,
      "inDetail": true,
      "outDetail": true,
      "batchImport": true,
      "userManage": true,
      "qcPurchase": true,
      "qcProduction": true,
      "qcDefect": true,
      "qcStandard": true,
      "operationLog": true
    }'::jsonb ELSE '{
      "stockView": false,
      "inDetail": false,
      "outDetail": false,
      "batchImport": false,
      "userManage": false,
      "qcPurchase": false,
      "qcProduction": false,
      "qcDefect": false,
      "qcStandard": false,
      "operationLog": false
    }'::jsonb END
  );
  RETURN NEW;
END;
$$;

-- 创建触发器
DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.confirmed_at IS NULL AND NEW.confirmed_at IS NOT NULL)
  EXECUTE FUNCTION handle_new_user();

-- 创建辅助函数检查是否为管理员
CREATE OR REPLACE FUNCTION is_admin(uid uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = uid AND p.role = 'admin'::user_role
  );
$$;

-- 配置profiles表的RLS策略
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "管理员拥有所有权限" ON profiles
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "用户可以查看自己的信息" ON profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "用户可以更新自己的信息（除角色外）" ON profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id)
  WITH CHECK (role IS NOT DISTINCT FROM (SELECT role FROM profiles WHERE id = auth.uid()));

-- 创建公开视图用于显示用户基本信息
CREATE VIEW public_profiles AS
  SELECT id, username, name, role FROM profiles;