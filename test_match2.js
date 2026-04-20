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
  
  // 模拟完整的匹配逻辑
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
  
  // 找到 P0126020014-01B2, package_no=72 的记录
  const targetRm = rmItems.find(rm => rm.batch_no === 'P0126020014-01B2' && rm.package_no === '72');
  console.log('Target rm:', targetRm);
  
  // 找到匹配的 si
  const matchingSi = siItems.filter(si => {
    const siPkg = String(si.package_no).trim();
    const siBatch = String(si.batch_no).trim();
    const siWeight = parseFloat(si.weight) || 0;
    return siPkg === '72' && siBatch === 'P0126020014' && siWeight === 151.25;
  });
  console.log('Matching si count:', matchingSi.length);
  console.log('Matching si:', matchingSi);
  
  // 测试完整的匹配逻辑
  if (targetRm) {
    const rmPkg = String(targetRm.package_no).trim();
    const rmBatch = String(targetRm.batch_no).trim();
    const rmWeight = parseFloat(targetRm.weight) || 0;
    const rmPrefix = rmBatch.split('-')[0];
    
    console.log('\n--- Testing match logic ---');
    console.log('rmPkg:', rmPkg);
    console.log('rmBatch:', rmBatch);
    console.log('rmWeight:', rmWeight);
    console.log('rmPrefix:', rmPrefix);
    
    const found = siItems.some(si => {
      const siPkg = String(si.package_no).trim();
      const siBatch = String(si.batch_no).trim();
      const siWeight = parseFloat(si.weight) || 0;
      
      const pkgMatch = siPkg === rmPkg;
      const batchMatch = siBatch === rmBatch || siBatch === rmPrefix;
      const weightMatch = siWeight === rmWeight;
      
      if (pkgMatch && batchMatch) {
        console.log('Candidate si:', { siPkg, siBatch, siWeight, pkgMatch, batchMatch, weightMatch });
      }
      
      return pkgMatch && batchMatch && weightMatch;
    });
    
    console.log('Found match:', found);
  }
  
  pool.end();
})();
