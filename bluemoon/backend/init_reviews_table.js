const db = require('./config/db');

const createTableQuery = `
    CREATE TABLE IF NOT EXISTS reviews (
        id INT PRIMARY KEY AUTO_INCREMENT,
        resident_id VARCHAR(20) NOT NULL,
        rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
        feedback TEXT,
        survey_response JSON COMMENT 'Câu trả lời khảo sát',
        status ENUM('Mới', 'Đã xem') DEFAULT 'Mới',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (resident_id) REFERENCES residents(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;
`;

async function run() {
    try {
        await db.execute(createTableQuery);
        console.log('✅ Reviews table created successfully or already exists.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating table:', error);
        process.exit(1);
    }
}

run();
