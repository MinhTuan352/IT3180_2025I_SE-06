// Script để TẠO TRỰC TIẾP tài khoản cho resident R0006
// Chạy: node test_create_user.js

const db = require('./config/db');
const bcrypt = require('bcryptjs');

(async () => {
    try {
        const residentId = 'R0006';
        const username = 'chuho_b2';
        const password = 'password123';
        const email = 'lhpl172005@gmail.com';
        const phone = '982081534';

        console.log('=== STEP 1: Check current state ===');
        const [residents] = await db.execute('SELECT id, full_name, user_id FROM residents WHERE id = ?', [residentId]);
        console.log('Resident:', residents[0]);

        console.log('\n=== STEP 2: Create user account ===');

        // Check if user already exists
        const [existingUser] = await db.execute('SELECT id FROM users WHERE id = ?', [residentId]);

        if (existingUser.length > 0) {
            console.log('User already exists, updating...');
            const hash = await bcrypt.hash(password, 10);
            await db.execute(
                'UPDATE users SET username = ?, password = ?, is_active = 1 WHERE id = ?',
                [username, hash, residentId]
            );
        } else {
            console.log('Creating new user...');
            const hash = await bcrypt.hash(password, 10);
            await db.execute(
                'INSERT INTO users (id, username, password, email, phone, role_id, is_active) VALUES (?, ?, ?, ?, ?, 3, 1)',
                [residentId, username, hash, email, phone]
            );
        }
        console.log('User created/updated!');

        console.log('\n=== STEP 3: Link user to resident ===');
        await db.execute('UPDATE residents SET user_id = ? WHERE id = ?', [residentId, residentId]);
        console.log('Resident updated with user_id!');

        console.log('\n=== STEP 4: Verify result ===');
        const [verifyResident] = await db.execute('SELECT id, full_name, user_id FROM residents WHERE id = ?', [residentId]);
        console.log('Resident after update:', verifyResident[0]);

        const [verifyUser] = await db.execute('SELECT id, username, is_active FROM users WHERE id = ?', [residentId]);
        console.log('User:', verifyUser[0]);

        console.log('\n✅ SUCCESS! Tài khoản đã được tạo. Thử đăng nhập với:');
        console.log(`   Username: ${username}`);
        console.log(`   Password: ${password}`);

        process.exit(0);
    } catch (e) {
        console.error('ERROR:', e.message);
        process.exit(1);
    }
})();
