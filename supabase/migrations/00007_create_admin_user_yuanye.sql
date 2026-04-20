-- 创建管理员账号：袁野
-- 手机号：19909096066
-- 密码：admin123

-- 首先在auth.users表中创建用户
-- 注意：Supabase使用email作为主要标识，我们使用手机号@miaoda.com格式
DO $$
DECLARE
  new_user_id uuid;
  hashed_password text;
BEGIN
  -- 生成UUID
  new_user_id := gen_random_uuid();
  
  -- 使用Supabase的密码加密函数
  -- 注意：这里使用crypt函数对密码进行加密
  hashed_password := crypt('admin123', gen_salt('bf'));
  
  -- 插入到auth.users表
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    phone,
    phone_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token,
    aud,
    role
  ) VALUES (
    new_user_id,
    '00000000-0000-0000-0000-000000000000',
    '19909096066@miaoda.com',
    hashed_password,
    now(),
    '19909096066',
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"name":"袁野","phone":"19909096066"}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    '',
    'authenticated',
    'authenticated'
  );
  
  -- 插入到profiles表
  INSERT INTO public.profiles (
    id,
    username,
    phone,
    name,
    role,
    app_permissions,
    web_permissions,
    created_at
  ) VALUES (
    new_user_id,
    '19909096066',
    '19909096066',
    '袁野',
    'admin'::public.user_role,
    '{
      "scanIn": true,
      "scanOut": true,
      "scanQuery": true,
      "manualQuery": true,
      "viewRecords": true
    }'::jsonb,
    '{
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
    }'::jsonb,
    now()
  );
  
  RAISE NOTICE '管理员账号创建成功！';
  RAISE NOTICE '手机号：19909096066';
  RAISE NOTICE '密码：admin123';
  RAISE NOTICE '姓名：袁野';
  RAISE NOTICE '角色：管理员';
  
END $$;