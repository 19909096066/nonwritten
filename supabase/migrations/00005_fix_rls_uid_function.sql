-- 创建uid()函数作为auth.uid()的别名
CREATE OR REPLACE FUNCTION uid()
RETURNS uuid LANGUAGE sql STABLE AS $$
  SELECT auth.uid();
$$;

-- 或者直接修改RLS策略使用auth.uid()
-- 先删除旧策略
DROP POLICY IF EXISTS "管理员可以管理所有原材料" ON raw_material;
DROP POLICY IF EXISTS "用户可以查看原材料" ON raw_material;
DROP POLICY IF EXISTS "用户可以入库" ON raw_material;
DROP POLICY IF EXISTS "用户可以出库" ON raw_material;

-- 重新创建策略，使用auth.uid()
CREATE POLICY "管理员可以管理所有原材料" ON raw_material
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "用户可以查看原材料" ON raw_material
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND (
        (web_permissions->>'stockView')::boolean = true
        OR (web_permissions->>'inDetail')::boolean = true
        OR (web_permissions->>'outDetail')::boolean = true
      )
    )
  );

CREATE POLICY "用户可以入库" ON raw_material
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND (app_permissions->>'scanIn')::boolean = true
    )
  );

CREATE POLICY "用户可以出库" ON raw_material
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND (app_permissions->>'scanOut')::boolean = true
    )
  );