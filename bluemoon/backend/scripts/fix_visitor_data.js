
const db = require('../config/db');

async function fixVisitorData() {
    console.log('🛠️ Starting Visitor Data Fix...');

    try {
        // 1. Fix Status Mismatch (Status 'Đã vào' but has Check-out time)
        console.log('1. Checking for inconsistent status...');
        const [rows1] = await db.execute(`
            SELECT id FROM visitors 
            WHERE status = 'Đã vào' AND check_out_time IS NOT NULL
        `);

        if (rows1.length > 0) {
            console.log(`   Found ${rows1.length} inconsistent rows. Fixing...`);
            await db.execute(`
                UPDATE visitors 
                SET status = 'Đã ra' 
                WHERE status = 'Đã vào' AND check_out_time IS NOT NULL
            `);
            console.log('   ✅ Fixed status.');
        } else {
            console.log('   ✅ No inconsistent status found.');
        }

        // 2. Fix Expected Arrival (If missing, default to Check-in time)
        console.log('2. Checking for missing expected_arrival...');
        // Only for records that have check_in_time (Walk-ins or Checked-in)
        const [rows2] = await db.execute(`
            SELECT id FROM visitors 
            WHERE expected_arrival IS NULL AND check_in_time IS NOT NULL
        `);

        if (rows2.length > 0) {
            console.log(`   Found ${rows2.length} rows with missing expected_arrival. Backfilling...`);
            await db.execute(`
                UPDATE visitors 
                SET expected_arrival = check_in_time 
                WHERE expected_arrival IS NULL AND check_in_time IS NOT NULL
            `);
            console.log('   ✅ Backfilled expected_arrival.');
        } else {
            console.log('   ✅ No missing expected_arrival found.');
        }

        console.log('🎉 Visitor Data Fix Completed successfully.');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error fixing data:', error);
        process.exit(1);
    }
}

fixVisitorData();
