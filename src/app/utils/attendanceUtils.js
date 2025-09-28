import StaffAttendance from '@/models/logTime';

// Auto-logout staff who forgot to logout
export const autoLogoutInactiveSessions = async () => {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  const inactiveSessions = await StaffAttendance.find({
    status: 'active',
    loginTime: { $lt: twentyFourHoursAgo },
    logoutTime: { $exists: false }
  });
  
  for (const session of inactiveSessions) {
    session.logLogout(twentyFourHoursAgo, 'system-logout', 'Auto-logout due to 24-hour inactivity');
    await session.save();
    console.log(`Auto-logged out session for staff ${session.staff} started at ${session.loginTime}`);
  }
  
  return inactiveSessions.length;
};

// Get staff attendance statistics
export const getStaffAttendanceStats = async (staffId, period = 'month') => {
  const now = new Date();
  let startDate;
  
  switch (period) {
    case 'week':
      startDate = new Date(now.getTime());
      startDate.setDate(startDate.getDate() - 7);
      break;
    case 'month':
      startDate = new Date(now.getTime());
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case 'quarter':
      startDate = new Date(now.getTime());
      startDate.setMonth(startDate.getMonth() - 3);
      break;
    default:
      startDate = new Date(now.getTime());
      startDate.setMonth(startDate.getMonth() - 1);
  }
  
  const stats = await StaffAttendance.aggregate([
    {
      $match: {
        staff: staffId,
        loginTime: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: null,
        totalSessions: { $sum: 1 },
        totalDuration: { $sum: '$sessionDuration' },
        averageDuration: { $avg: '$sessionDuration' },
        daysWithAttendance: { $addToSet: { $dateToString: { format: '%Y-%m-%d', date: '$loginTime' } } }
      }
    },
    {
      $project: {
        totalSessions: 1,
        totalDuration: 1,
        averageDuration: 1,
        uniqueDays: { $size: '$daysWithAttendance' }
      }
    }
  ]);
  
  return stats.length > 0 ? stats[0] : null;
};