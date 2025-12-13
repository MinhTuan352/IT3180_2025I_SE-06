const db = require('./config/db');

async function run() {
    try {
        const [rows] = await db.execute('SELECT id, full_name, user_id FROM residents LIMIT 5');
        console.log('Residents:', rows);
        process.exit(0);
    } catch (error) {
        console.error('Error fetching residents:', error);
        process.exit(1);
    }
}

run();
