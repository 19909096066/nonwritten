const mysql = require('mysql2/promise');
(async () => {
  const pool = mysql.createPool({
    host: 'gz-cynosdbmysql-grp-g4mz63v7.sql.tencentcdb.com',
    port: 29477,
    user: 'root',
    password: 'Mygbbyy1.',
    database: 'nonwoven',
    charset: 'utf8mb4'
  });
  
  // 完全模拟 server.js 的匹配逻辑
  const [rmItems] = await pool.execute(`
    SELECT id, batch_no, package_no, weight, model, created_at, qr_code
    FROM raw_materials 
    WHERE status IN ('in_stock', 'split')
    ORDER BY created_at DESC
  `);
  
  const [siItems] = await pool.execute(`
    SELECT batch_no, package_no, weight
    FROM shipping_items 
    WHERE batch_no IS NOT NULL
  `);
  
  console.log('rmItems count:', rmItems.length);
  console.log('siItems count:', siItems.length);
  
  // 完全使用 server.js 的匹配逻辑
  const unimported = rmItems.filter(rm => {
    const rmPkg = String(rm.package_no).trim();
    const rmBatch = String(rm.batch_no).trim();
    const rmWeight = parseFloat(rm.weight) || 0;
    const rmPrefix = rmBatch.split('-')[0];
    
    return !siItems.some(si => {
      const siPkg = String(si.package_no).trim();
      const siBatch = String(si.batch_no).trim();
      const siWeight = parseFloat(si.weight) || 0;
      
      const pkgMatch = siPkg === rmPkg;
      const batchMatch = siBatch === rmBatch || siBatch === rmPrefix;
      const weightMatch = siWeight === rmWeight;
      
      return pkgMatch && batchMatch && weightMatch;
    });
  });
  
  console.log('unimported count:', unimported.length);
  
  // 检查 P0126020014-01B2, package_no=72 是否在 unimported 中
  const found = unimported.find(u => u.batch_no === 'P0126020014-01B2' && u.package_no === '72');
  if (found) {
    console.log('\n!!! ERROR: P0126020014-01B2, 72 仍在 unimported 中 !!!');
    console.log(found);
  } else {
    console.log('\n✓ P0126020014-01B2, 72 已被正确过滤');
  }
  
  pool.end();
})();
