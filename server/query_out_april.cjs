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
    // 按型号汇总
    const [byModel] = await pool.query(`
      SELECT rm.model, COUNT(*) as out_count, SUM(rm.weight) as total_weight
      FROM operation_logs ol
      JOIN raw_materials rm ON ol.qr_code = rm.qr_code
      WHERE ol.operation_type = "OUT"
        AND DATE(ol.operate_time) >= "2026-04-01"
      GROUP BY rm.model
      ORDER BY total_weight DESC
    `);

    console.log("=== 4月份出库汇总 (按型号) ===");
    console.table(byModel);

    const totalWeight = byModel.reduce((sum, r) => sum + Number(r.total_weight), 0);
    const totalCount = byModel.reduce((sum, r) => sum + r.out_count, 0);
    console.log("\n4月份总出库: " + totalCount + " 次, " + totalWeight.toFixed(2) + " kg");

  } finally {
    await pool.end();
  }
}

query().catch(e => { console.error(e.message); process.exit(1); });
