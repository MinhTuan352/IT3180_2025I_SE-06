const db = require('../config/db');

async function createPendingDonationsTable() {
    try {
        const connection = await db.getConnection();
        console.log('Connected to database.');

        const sql = `
            CREATE TABLE IF NOT EXISTS pending_donations (
                temp_id VARCHAR(50) PRIMARY KEY,
                campaign_id INT NOT NULL,
                resident_id VARCHAR(20) NOT NULL,
                amount DECIMAL(15,2) NOT NULL,
                note TEXT,
                is_anonymous BOOLEAN DEFAULT FALSE,
                status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB;
        `;

        await connection.query(sql);
        console.log('Created pending_donations table successfully.');
        connection.release();
        process.exit(0);
    } catch (error) {
        console.error('Error creating table:', error);
        process.exit(1);
    }
}

createPendingDonationsTable();
