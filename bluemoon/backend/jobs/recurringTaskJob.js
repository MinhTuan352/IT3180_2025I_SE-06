// File: backend/jobs/recurringTaskJob.js
// Cron Job tự động sinh công việc từ lịch định kỳ

const AccountingTask = require('../models/accountingTaskModel');
const RecurringSchedule = require('../models/recurringScheduleModel');

/**
 * Chạy job tự động sinh công việc từ lịch định kỳ
 * Job này nên được gọi mỗi ngày (VD: 00:01)
 */
async function runRecurringTaskJob() {
    console.log('🔄 [RecurringTaskJob] Starting job...');

    try {
        // 1. Đánh dấu các task quá hạn
        const overdueResult = await AccountingTask.markOverdueTasks();
        if (overdueResult.affectedRows > 0) {
            console.log(`⚠️  [RecurringTaskJob] Marked ${overdueResult.affectedRows} tasks as overdue`);
        }

        // 2. Lấy các lịch cần chạy hôm nay
        const schedules = await RecurringSchedule.getSchedulesToRun();
        console.log(`📋 [RecurringTaskJob] Found ${schedules.length} schedules to run`);

        if (schedules.length === 0) {
            console.log('✅ [RecurringTaskJob] No schedules to run today');
            return { created: 0, schedules: [] };
        }

        const createdTasks = [];

        // 3. Tạo task từ mỗi schedule
        for (const schedule of schedules) {
            try {
                // Tính period_value (VD: '2025-01', 'Q1-2025')
                const periodValue = RecurringSchedule.calculatePeriodValue(schedule);

                // Tính ngày bắt đầu và deadline
                const startDate = new Date().toISOString().split('T')[0];
                const dueDate = new Date();
                dueDate.setDate(dueDate.getDate() + (schedule.deadline_offset_days || 7));

                // Dữ liệu task mới
                const taskData = {
                    title: schedule.title,
                    description: schedule.description,
                    task_type: 'recurring',
                    category: schedule.category,
                    period_type: schedule.frequency,
                    period_value: periodValue,
                    start_date: startDate,
                    due_date: dueDate.toISOString().split('T')[0],
                    assigned_to: schedule.default_assignee,
                    priority: schedule.priority,
                    recurring_schedule_id: schedule.id,
                    notes: `Tự động tạo từ lịch định kỳ #${schedule.id}`
                };

                // Tạo task
                const task = await AccountingTask.createTask(taskData);
                console.log(`✅ [RecurringTaskJob] Created task: "${task.title}" (ID: ${task.id})`);
                createdTasks.push(task);

                // 4. Cập nhật next_run_date cho schedule
                const nextRunDate = RecurringSchedule.calculateNextRunDate(schedule);
                await RecurringSchedule.updateAfterRun(schedule.id, nextRunDate);
                console.log(`📅 [RecurringTaskJob] Schedule #${schedule.id} next run: ${nextRunDate}`);

            } catch (taskError) {
                console.error(`❌ [RecurringTaskJob] Error creating task from schedule #${schedule.id}:`, taskError.message);
            }
        }

        console.log(`🎉 [RecurringTaskJob] Completed! Created ${createdTasks.length} tasks`);
        return { created: createdTasks.length, tasks: createdTasks };

    } catch (error) {
        console.error('❌ [RecurringTaskJob] Job failed:', error.message);
        throw error;
    }
}

module.exports = {
    run: runRecurringTaskJob
};
