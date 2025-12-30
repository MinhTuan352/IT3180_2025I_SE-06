const db = require('./config/db');
require('dotenv').config();

async function debugDupes() {
    try {
        console.log('--- Checking Task ID 19 ---');
        const [rows] = await db.query('SELECT * FROM accounting_tasks WHERE id = 19');
        console.log(`Raw rows in table for ID 19: ${rows.length}`);
        if (rows.length > 0) {
            console.log('Task 19 assigned_to:', rows[0].assigned_to);
            console.log('Task 19 assigned_by:', rows[0].assigned_by);
        }

        console.log('\n--- Running getAllTasks Query for ID 19 ---');
        let query = `
            SELECT 
                t.id, t.title,
                u_assigned.username as assigned_to_name,
                u_by.username as assigned_by_name
            FROM accounting_tasks t
            LEFT JOIN users u_assigned ON t.assigned_to = u_assigned.id
            LEFT JOIN users u_by ON t.assigned_by = u_by.id
            LEFT JOIN recurring_schedules rs ON t.recurring_schedule_id = rs.id
            WHERE t.id = 19
        `;
        const [joinRows] = await db.query(query);
        console.log(`Rows returned by JOIN query: ${joinRows.length}`);
        console.log(joinRows);

        if (joinRows.length > 1) {
            console.log('\n--- Investigating Users ---');
            const assignedTo = rows[0].assigned_to;
            if (assignedTo) {
                const [users] = await db.query('SELECT * FROM users WHERE id = ?', [assignedTo]);
                console.log(`Users matching assigned_to (${assignedTo}): ${users.length}`);
            }
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit();
    }
}

debugDupes();
