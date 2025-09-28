// utils/attendanceCleanup.js
import StaffAttendance from '../models/logTime.js';
import cron from 'node-cron';

// Run cleanup on the 16th of every month at 3 AM (after the 15th deletion date)
export const setupAttendanceCleanup = () => {
  cron.schedule('0 3 16 * *', async () => {
    try {
      // Auto-delete records that passed their deletion date
      const deletionResult = await StaffAttendance.autoDeleteOldRecords();
      
      // Cleanup incomplete sessions (older than 24 hours)
      const cleanupCount = await StaffAttendance.cleanupIncompleteSessions();
      
      console.log(`Attendance cleanup: Deleted ${deletionResult.deletedCount} old records, cleaned up ${cleanupCount} incomplete sessions`);
      
      // Log details of deleted records for audit
      if (deletionResult.records.length > 0) {
        console.log('Deleted records summary:');
        deletionResult.records.forEach(record => {
          console.log(`- Staff: ${record.staff}, Login: ${record.loginTime}, Sessions: ${record.sessionDuration}min`);
        });
      }
    } catch (error) {
      console.error('Attendance cleanup error:', error);
    }
  });
};

// Manual cleanup function for testing
export const manualCleanup = async () => {
  const deletionResult = await StaffAttendance.autoDeleteOldRecords();
  const cleanupCount = await StaffAttendance.cleanupIncompleteSessions();
  
  return {
    deletedCount: deletionResult.deletedCount,
    cleanupCount: cleanupCount,
    deletedRecords: deletionResult.records
  };
};

// Function to check upcoming deletions
export const getUpcomingDeletions = async () => {
  return await StaffAttendance.getDeletionSchedule();
};