-- 修复管理员账号的email格式
-- 将 19909096066@miaoda.com 改为 19909096066@nonwoven.local

UPDATE auth.users
SET email = '19909096066@nonwoven.local',
    raw_user_meta_data = jsonb_set(
      raw_user_meta_data,
      '{email}',
      '"19909096066@nonwoven.local"'
    ),
    updated_at = now()
WHERE phone = '19909096066' AND email = '19909096066@miaoda.com';

-- 验证更新
DO $$
DECLARE
  updated_email text;
BEGIN
  SELECT email INTO updated_email
  FROM auth.users
  WHERE phone = '19909096066';
  
  IF updated_email = '19909096066@nonwoven.local' THEN
    RAISE NOTICE '✅ 管理员账号email已成功更新为: %', updated_email;
  ELSE
    RAISE NOTICE '❌ 更新失败，当前email为: %', updated_email;
  END IF;
END $$;