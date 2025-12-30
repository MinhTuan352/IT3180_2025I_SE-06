const db = require('./config/db');
require('dotenv').config();

async function fixSchema() {
    console.log('🚀 Starting Schema Fix for Accounting Tables...');

    const tables = [
        {
            table: 'accounting_tasks',
            columns: ['assigned_to', 'assigned_by']
        },
        {
            table: 'recurring_schedules',
            columns: ['default_assignee', 'created_by']
        }
    ];

    try {
        for (const { table, columns } of tables) {
            for (const col of columns) {
                console.log(`Modifying ${table}.${col} to VARCHAR(20)...`);
                // Use MODIFY to change type
                await db.query(`ALTER TABLE ${table} MODIFY COLUMN ${col} VARCHAR(20) DEFAULT NULL`);
            }
        }

        console.log('✅ Schema updated successfully.');

        // Clean up data
        console.log('Cleaning up bad data (0 values)...');
        await db.query(`UPDATE accounting_tasks SET assigned_to = NULL WHERE assigned_to = '0'`);
        await db.query(`UPDATE accounting_tasks SET assigned_by = NULL WHERE assigned_by = '0'`);
        await db.query(`UPDATE recurring_schedules SET default_assignee = NULL WHERE default_assignee = '0'`);
        await db.query(`UPDATE recurring_schedules SET created_by = NULL WHERE created_by = '0'`);

        // Delete the messed up duplicate task (ID 19)
        console.log('Deleting problematic Task 19...');
        await db.query('DELETE FROM accounting_tasks WHERE id = 19');

        console.log('✅ Data cleanup complete.');

    } catch (error) {
        console.error('❌ Error during schema fix:', error);
    } finally {
        process.exit();
    }
}

fixSchema();
