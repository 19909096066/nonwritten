-- 更新现有管理员账号的信息
UPDATE public.profiles
SET 
  name = '袁野',
  phone = '19909096066',
  role = 'admin',
  app_permissions = '{
    "scanIn": true,
    "scanOut": true,
    "scanQuery": true,
    "manualQuery": true,
    "viewRecords": true
  }'::jsonb,
  web_permissions = '{
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
  }'::jsonb
WHERE username = '19909096066';

-- 更新auth.users表中的email和密码
UPDATE auth.users
SET 
  email = '19909096066@nonwoven.local',
  encrypted_password = crypt('admin123', gen_salt('bf')),
  email_confirmed_at = now(),
  updated_at = now()
WHERE id = (SELECT id FROM profiles WHERE username = '19909096066');

-- 更新profiles表的触发器函数
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  extracted_phone text;
BEGIN
  -- 从email中提取手机号（去掉@nonwoven.local）
  extracted_phone := REPLACE(NEW.email, '@nonwoven.local', '');
  
  -- 插入profile，使用手机号作为username和phone
  INSERT INTO public.profiles (id, username, phone, name, role, app_permissions, web_permissions)
  VALUES (
    NEW.id,
    extracted_phone,
    extracted_phone,
    extracted_phone,
    'user',
    '{
      "scanIn": false,
      "scanOut": false,
      "scanQuery": false,
      "manualQuery": false,
      "viewRecords": false
    }'::jsonb,
    '{
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
    }'::jsonb
  );
  RETURN NEW;
END;
$$;