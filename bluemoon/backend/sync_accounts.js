const xlsx = require('xlsx');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config();

async function syncAccounts() {
    console.log("Starting account synchronization with Excel...");
    const filePath = path.join(__dirname, '../data/BlueMoon_Resident_Data_Generated.xlsx');

    // Explicitly disable SSL to bypass handshake errors
    const pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'bluemoon_db',
        ssl: false
    });

    try {
        if (!require('fs').existsSync(filePath)) {
            throw new Error(`File not found: ${filePath}`);
        }

        const workbook = xlsx.readFile(filePath);
        const sheet = workbook.Sheets['Residents'];
        const data = xlsx.utils.sheet_to_json(sheet);
        console.log(`Excel contains ${data.length} records.`);

        const connection = await pool.getConnection();

        try {
            let removed = 0;
            let added = 0;
            let kept = 0;

            // 1. Create a Map of CCCD -> Expected Account Status from Excel
            const excelMap = new Map();
            data.forEach(row => {
                if (row['CCCD']) {
                    excelMap.set(String(row['CCCD']).trim(), {
                        hasAccount: !!row['Username'],
                        username: row['Username'],
                        password: row['Password'] || '123456',
                        email: row['Email'],
                        phone: row['SĐT']
                    });
                }
            });

            // 2. Fetch all residents from DB
            const [residents] = await connection.execute('SELECT id, cccd, user_id FROM residents');

            for (const r of residents) {
                const cccd = r.cccd ? String(r.cccd).trim() : null;
                const excelInfo = excelMap.get(cccd);

                if (!excelInfo) {
                    // Resident in DB but not in Excel (Old data?) -> Skip or Handle?
                    // User said "Update current data", assuming current data IS from this Excel import (or incomplete).
                    // We'll leave them alone if not in Excel to be safe, OR clean them up if they have user_id but shouldn't?
                    // Let's focus on matching the Excel logic for those WHO EXIST in Excel.
                    continue;
                }

                if (excelInfo.hasAccount) {
                    // SHOULD HAVE ACCOUNT
                    if (!r.user_id) {
                        // Create Account (Missing)
                        // Note: Check if username taken handled in previous scripts, let's just do simple insert
                        // Check if User ID already exists (e.g. from a different resident?? shouldn't happen)
                        const [idCheck] = await connection.execute('SELECT id FROM users WHERE id = ?', [r.id]);
                        if (idCheck.length === 0) {
                            const hash = await bcrypt.hash(excelInfo.password, 10);
                            // Handle duplicate username globally?
                            // Assuming generated data is clean.
                            try {
                                await connection.execute(
                                    `INSERT INTO users (id, username, password, email, phone, role_id, is_active) VALUES (?, ?, ?, ?, ?, 3, 1)`,
                                    [r.id, excelInfo.username, hash, excelInfo.email, excelInfo.phone]
                                );
                                await connection.execute('UPDATE residents SET user_id = ? WHERE id = ?', [r.id, r.id]);
                                added++;
                            } catch (err) {
                                console.log(`Failed to add user for ${cccd}: ${err.message}`);
                            }
                        } else {
                            // Link only
                            await connection.execute('UPDATE residents SET user_id = ? WHERE id = ?', [r.id, r.id]);
                            added++;
                        }
                    } else {
                        kept++;
                    }
                } else {
                    // SHOULD NOT HAVE ACCOUNT
                    if (r.user_id) {
                        // Create dummy removal
                        console.log(`Removing account for ${cccd} (Should not have one)`);
                        const uid = r.user_id;
                        await connection.execute('UPDATE residents SET user_id = NULL WHERE id = ?', [r.id]);
                        await connection.execute('DELETE FROM users WHERE id = ?', [uid]);
                        removed++;
                    }
                }
            }

            console.log(`Sync Complete: Added ${added}, Removed ${removed}, Kept ${kept}.`);

        } finally {
            connection.release();
        }

    } catch (e) {
        console.error("Error:", e);
    } finally {
        process.exit(0);
    }
}

syncAccounts();
