-- 创建操作类型枚举
CREATE TYPE public.operation_type AS ENUM (
  'IN',           -- 入库
  'OUT',          -- 出库
  'IMPORT',       -- 批量导入
  'USER_ADD',     -- 添加用户
  'USER_EDIT',    -- 编辑用户
  'USER_DELETE',  -- 删除用户
  'QC_ADD',       -- 添加质检记录
  'QC_EDIT',      -- 编辑质检记录
  'QC_DELETE',    -- 删除质检记录
  'LOGIN',        -- 登录
  'LOGOUT'        -- 登出
);

-- 创建操作日志表
CREATE TABLE public.operation_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  qr_code text,
  operation_type public.operation_type NOT NULL,
  operator text NOT NULL,
  operate_time timestamptz DEFAULT now(),
  detail text,
  ip text
);

-- 创建索引
CREATE INDEX idx_operation_log_operator ON operation_log(operator);
CREATE INDEX idx_operation_log_type ON operation_log(operation_type);
CREATE INDEX idx_operation_log_time ON operation_log(operate_time DESC);

-- 配置RLS策略
ALTER TABLE operation_log ENABLE ROW LEVEL SECURITY;

-- 管理员可以查看所有日志
CREATE POLICY "管理员可以查看所有日志" ON operation_log
  FOR SELECT TO authenticated USING (is_admin(auth.uid()));

-- 有权限的用户可以查看日志
CREATE POLICY "用户可以查看日志" ON operation_log
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND (web_permissions->>'operationLog')::boolean = true
    )
  );

-- 所有认证用户可以插入日志
CREATE POLICY "用户可以创建日志" ON operation_log
  FOR INSERT TO authenticated WITH CHECK (true);