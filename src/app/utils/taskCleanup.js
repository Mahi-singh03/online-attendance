import Task from '@/models/task';
import cron from 'node-cron';

// Run cleanup on 16th of every month at 2 AM (after the 15th deletion date)
export const setupTaskCleanup = () => {
  // Schedule for 16th of every month at 2 AM
  cron.schedule('0 2 16 * *', async () => {
    try {
      // Delete completed tasks older than 3 months
      const deletedCount = await Task.autoDeleteOldTasks();
      
      // Update retention periods for tasks older than 3 months
      const updatedCount = await Task.updateRetentionPeriods();
      
      console.log(`Task cleanup: Deleted ${deletedCount} old tasks, updated ${updatedCount} retention periods on ${new Date().toISOString()}`);
    } catch (error) {
      console.error('Task cleanup error:', error);
    }
  });

  // Additional safety check - run weekly to catch any missed deletions
  cron.schedule('0 3 * * 1', async () => { // Every Monday at 3 AM
    try {
      const deletedCount = await Task.autoDeleteOldTasks();
      if (deletedCount > 0) {
        console.log(`Weekly safety check: Deleted ${deletedCount} overdue tasks`);
      }
    } catch (error) {
      console.error('Weekly task cleanup error:', error);
    }
  });
};

// Manual cleanup function for testing
export const manualCleanup = async () => {
  const deletedCount = await Task.autoDeleteOldTasks();
  const updatedCount = await Task.updateRetentionPeriods();
  
  return { deletedCount, updatedCount };
};

// Function to check tasks scheduled for deletion
export const getTasksScheduledForDeletion = async () => {
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  
  return await Task.find({
    retentionPeriod: 'completed-storage',
    retentionStartDate: { $lt: threeMonthsAgo }
  })
  .populate('assignedTo', 'name email')
  .populate('assignedBy', 'name email')
  .sort({ retentionStartDate: 1 })
  .exec();
};

// Function to get cleanup statistics
export const getCleanupStats = async () => {
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  
  const tasksForDeletion = await Task.countDocuments({
    retentionPeriod: 'completed-storage',
    retentionStartDate: { $lt: threeMonthsAgo }
  });
  
  const gracePeriodTasks = await Task.countDocuments({
    retentionPeriod: 'grace-period'
  });
  
  const permanentTasks = await Task.countDocuments({
    retentionPeriod: 'permanent'
  });
  
  return {
    tasksScheduledForDeletion: tasksForDeletion,
    gracePeriodTasks: gracePeriodTasks,
    permanentTasks: permanentTasks,
    nextCleanupDate: getNextCleanupDate()
  };
};

// Helper function to get next cleanup date
export const getNextCleanupDate = () => {
  const now = new Date();
  const nextCleanup = new Date();
  
  if (now.getDate() >= 16) {
    nextCleanup.setMonth(now.getMonth() + 1);
  }
  nextCleanup.setDate(16);
  nextCleanup.setHours(2, 0, 0, 0);
  
  return nextCleanup;
};