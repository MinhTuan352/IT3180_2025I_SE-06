const db = require('./config/db');

(async () => {
    try {
        // Simulate what residentModel.findById returns
        const query = `
            SELECT 
                r.*, 
                a.apartment_code, 
                a.building,
                u.username as account_username,
                u.email as account_email,
                CASE WHEN r.user_id IS NOT NULL THEN 1 ELSE 0 END as has_account
            FROM residents r
            JOIN apartments a ON r.apartment_id = a.id
            LEFT JOIN users u ON r.user_id = u.id
            WHERE r.id = ?
        `;
        const [rows] = await db.execute(query, ['R0006']);

        console.log('=== API RESPONSE (what frontend receives) ===');
        console.log(JSON.stringify(rows[0], null, 2));

        console.log('\n=== KEY FIELDS FOR ACCOUNT CHECK ===');
        console.log('user_id:', rows[0]?.user_id);
        console.log('has_account:', rows[0]?.has_account);
        console.log('account_username:', rows[0]?.account_username);

        process.exit(0);
    } catch (e) {
        console.error('ERROR:', e.message);
        process.exit(1);
    }
})();
