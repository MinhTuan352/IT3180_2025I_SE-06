const db = require('./config/db');

(async () => {
    try {
        // Check resident by CCCD
        const [residents] = await db.execute(
            'SELECT id, full_name, user_id, cccd FROM residents WHERE cccd = ?',
            ['1305036182']
        );
        console.log('=== RESIDENTS with CCCD 1305036182 ===');
        console.log(JSON.stringify(residents, null, 2));

        // Check if user_id exists in users table
        if (residents.length > 0 && residents[0].user_id) {
            const [users] = await db.execute(
                'SELECT id, username, is_active FROM users WHERE id = ?',
                [residents[0].user_id]
            );
            console.log('\n=== USERS TABLE for user_id ===');
            console.log(JSON.stringify(users, null, 2));
        } else {
            console.log('\n=== NO USER_ID LINKED ===');
        }

        // Check if user chuho_b2 exists
        const [allUsers] = await db.execute(
            'SELECT id, username, is_active FROM users WHERE username = ?',
            ['chuho_b2']
        );
        console.log('\n=== USER chuho_b2 ===');
        console.log(JSON.stringify(allUsers, null, 2));

        process.exit(0);
    } catch (e) {
        console.error('Error:', e.message);
        process.exit(1);
    }
})();
