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
    // 用北京时间查询（DATE_ADD 将 UTC 转为北京时间）
    const [daily] = await pool.query(`
      SELECT
        DATE(DATE_ADD(ol.operate_time, INTERVAL 8 HOUR)) as date,
        ol.operation_type,
        COUNT(*) as cnt,
        SUM(rm.weight) as total_weight
      FROM operation_logs ol
      LEFT JOIN raw_materials rm ON ol.qr_code = rm.qr_code
      WHERE DATE(ol.operate_time) >= "2026-03-31"
        AND ol.operation_type IN ("OUT", "SPLIT")
      GROUP BY DATE(DATE_ADD(ol.operate_time, INTERVAL 8 HOUR)), ol.operation_type
      ORDER BY date, operation_type
    `);
    console.log("=== 4月份每日明细（北京时间）===");
    console.table(daily);

    // 每天总计
    const [dailyTotal] = await pool.query(`
      SELECT
        DATE(DATE_ADD(ol.operate_time, INTERVAL 8 HOUR)) as date,
        COUNT(*) as total_cnt,
        SUM(rm.weight) as total_weight
      FROM operation_logs ol
      LEFT JOIN raw_materials rm ON ol.qr_code = rm.qr_code
      WHERE DATE(ol.operate_time) >= "2026-03-31"
        AND ol.operation_type IN ("OUT", "SPLIT")
      GROUP BY DATE(DATE_ADD(ol.operate_time, INTERVAL 8 HOUR))
      ORDER BY date
    `);
    console.log("\n=== 4月份每日总计（北京时间）===");
    console.table(dailyTotal);

    const totalWeight = dailyTotal.reduce((sum, r) => sum + Number(r.total_weight), 0);
    const totalCnt = dailyTotal.reduce((sum, r) => sum + r.total_cnt, 0);
    console.log("\n4月份累计: " + totalCnt + " 次, " + totalWeight.toFixed(2) + " kg");

  } finally {
    await pool.end();
  }
}

query().catch(e => { console.error(e.message); process.exit(1); });
