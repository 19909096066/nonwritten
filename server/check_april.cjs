const mysql = require("mysql2/promise");

async function query() {
  const pool = mysql.createPool({
    host: "gz-cynosdbmysql-grp-g4mz63v7.sql.tencentcdb.com",
    port: 29477,
    user: "root",
    password: "Mygbbyy1.",
    database: "nonwoven"
  });

  try {
    // 1. 查看所有操作类型
    const [types] = await pool.query(`
      SELECT DISTINCT operation_type, COUNT(*) as cnt 
      FROM operation_logs 
      GROUP BY operation_type
    `);
    console.log("=== 操作类型分布 ===");
    console.table(types);

    // 2. 查看4月份各种操作的数量
    const [aprilAll] = await pool.query(`
      SELECT operation_type, COUNT(*) as cnt 
      FROM operation_logs 
      WHERE DATE(operate_time) >= "2026-04-01"
      GROUP BY operation_type
    `);
    console.log("\n=== 4月份操作类型分布 ===");
    console.table(aprilAll);

    // 3. 查看4月份 OUT + SPLIT 的汇总
    const [aprilDetail] = await pool.query(`
      SELECT 
        ol.operation_type,
        rm.model,
        COUNT(*) as cnt,
        SUM(rm.weight) as total_weight
      FROM operation_logs ol
      LEFT JOIN raw_materials rm ON ol.qr_code = rm.qr_code
      WHERE DATE(ol.operate_time) >= "2026-04-01"
        AND ol.operation_type IN ("OUT", "SPLIT")
      GROUP BY ol.operation_type, rm.model
      ORDER BY ol.operation_type, total_weight DESC
    `);
    console.log("\n=== 4月份 OUT+SPLIT 按型号汇总 ===");
    console.table(aprilDetail);

    // 4. 直接查询4月份 raw_materials status变化
    const [stockOut] = await pool.query(`
      SELECT status, COUNT(*) as cnt, SUM(weight) as total_weight
      FROM raw_materials
      WHERE out_at >= "2026-04-01"
      GROUP BY status
    `);
    console.log("\n=== 4月份出库物料(status变化) ===");
    console.table(stockOut);

  } finally {
    await pool.end();
  }
}

query().catch(e => { console.error(e.message); process.exit(1); });
