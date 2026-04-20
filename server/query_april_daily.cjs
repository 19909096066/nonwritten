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
    // 4月份每天 OUT + SPLIT 汇总
    const [daily] = await pool.query(`
      SELECT 
        DATE(ol.operate_time) as date,
        ol.operation_type,
        COUNT(*) as cnt,
        SUM(rm.weight) as total_weight
      FROM operation_logs ol
      LEFT JOIN raw_materials rm ON ol.qr_code = rm.qr_code
      WHERE DATE(ol.operate_time) >= "2026-04-01"
        AND ol.operation_type IN ("OUT", "SPLIT")
      GROUP BY DATE(ol.operate_time), ol.operation_type
      ORDER BY date, operation_type
    `);
    console.log("=== 4月份每日明细 ===");
    console.table(daily);

    // 4月份每天总计
    const [dailyTotal] = await pool.query(`
      SELECT 
        DATE(ol.operate_time) as date,
        COUNT(*) as total_cnt,
        SUM(rm.weight) as total_weight
      FROM operation_logs ol
      LEFT JOIN raw_materials rm ON ol.qr_code = rm.qr_code
      WHERE DATE(ol.operate_time) >= "2026-04-01"
        AND ol.operation_type IN ("OUT", "SPLIT")
      GROUP BY DATE(ol.operate_time)
      ORDER BY date
    `);
    console.log("\n=== 4月份每日总计 ===");
    console.table(dailyTotal);

    const totalWeight = dailyTotal.reduce((sum, r) => sum + Number(r.total_weight), 0);
    const totalCnt = dailyTotal.reduce((sum, r) => sum + r.total_cnt, 0);
    console.log("\n4月份累计: " + totalCnt + " 次, " + totalWeight.toFixed(2) + " kg");

  } finally {
    await pool.end();
  }
}

query().catch(e => { console.error(e.message); process.exit(1); });
