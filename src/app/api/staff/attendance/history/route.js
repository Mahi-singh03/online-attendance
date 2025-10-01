import dbConnect from '@/lib/DBconnection';
import StaffAttendance from '@/models/staffAttendance';
import { authenticateToken } from '@/lib/authMiddleware';

export async function GET(req) {
  try {
    await dbConnect();

    const authResult = await authenticateToken(req);
    if (!authResult.isValid) {
      return new Response(JSON.stringify({ 
        success: false,
        message: authResult.message 
      }), {
        status: authResult.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { searchParams } = new URL(req.url);
    const staffId = authResult.user.id;
    
    const period = searchParams.get('period') || 'month'; // month, week, year, custom
    const year = searchParams.get('year') || new Date().getFullYear();
    const month = searchParams.get('month'); // 1-12
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let matchQuery = { staff: staffId };
    let groupByFormat = '%Y-%m';

    // Build date range based on period
    if (period === 'month' && month) {
      const monthYear = `${year}-${String(month).padStart(2, '0')}`;
      matchQuery.monthYear = monthYear;
      groupByFormat = '%Y-%m-%d'; // Daily grouping for monthly view
    } else if (period === 'year') {
      matchQuery.loginTime = {
        $gte: new Date(`${year}-01-01`),
        $lte: new Date(`${year}-12-31T23:59:59.999Z`)
      };
      groupByFormat = '%Y-%m'; // Monthly grouping for yearly view
    } else if (period === 'custom' && startDate && endDate) {
      matchQuery.loginTime = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
      groupByFormat = '%Y-%m-%d'; // Daily grouping for custom range
    } else {
      // Default: current month
      const currentDate = new Date();
      const currentMonthYear = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      matchQuery.monthYear = currentMonthYear;
      groupByFormat = '%Y-%m-%d';
    }

    const summary = await StaffAttendance.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: { $dateToString: { format: groupByFormat, date: '$loginTime' } },
          totalSessions: { $sum: 1 },
          totalDuration: { $sum: '$sessionDuration' },
          averageDuration: { $avg: '$sessionDuration' },
          completedSessions: {
            $sum: { $cond: [{ $in: ['$status', ['completed', 'forced-logout']] }, 1, 0] }
          },
          activeSessions: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          systemLogouts: {
            $sum: { $cond: [{ $eq: ['$status', 'system-logout'] }, 1, 0] }
          },
          sessions: {
            $push: {
              id: '$_id',
              loginTime: '$loginTime',
              logoutTime: '$logoutTime',
              duration: '$sessionDuration',
              status: '$status',
              deviceType: '$deviceInfo.deviceType'
            }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Calculate overall stats
    const overallStats = {
      totalSessions: summary.reduce((acc, day) => acc + day.totalSessions, 0),
      totalDuration: summary.reduce((acc, day) => acc + day.totalDuration, 0),
      averageDuration: summary.length > 0 ? summary.reduce((acc, day) => acc + day.averageDuration, 0) / summary.length : 0,
      completedSessions: summary.reduce((acc, day) => acc + day.completedSessions, 0),
      activeSessions: summary.reduce((acc, day) => acc + day.activeSessions, 0),
      uniqueDays: summary.length
    };

    return new Response(JSON.stringify({
      success: true,
      data: {
        summary,
        overallStats,
        period,
        dateRange: {
          startDate: matchQuery.loginTime?.$gte || null,
          endDate: matchQuery.loginTime?.$lte || null
        }
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Get attendance summary error:', error);
    return new Response(JSON.stringify({ 
      success: false,
      message: 'Internal server error',
      error: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}