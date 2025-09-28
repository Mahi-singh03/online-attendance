import dbConnect from '@/lib/DBconnection';
import StaffAttendance from '@/models/logTime';

export async function GET(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const staffId = searchParams.get('staffId');

    if (!staffId) {
      return new Response(JSON.stringify({ 
        success: false,
        message: 'Staff ID is required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get current active session
    const activeSession = await StaffAttendance.findOne({
      staff: staffId,
      status: 'active',
      logoutTime: { $exists: false }
    }).populate('staff', 'name email');

    const isLoggedIn = !!activeSession;

    // Get today's attendance summary
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todaySessions = await StaffAttendance.find({
      staff: staffId,
      loginTime: { $gte: todayStart, $lte: todayEnd }
    }).sort({ loginTime: -1 });

    // Calculate today's total duration
    const todayTotalDuration = todaySessions.reduce((total, session) => {
      return total + (session.sessionDuration || 0);
    }, 0);

    const hours = Math.floor(todayTotalDuration / 60);
    const minutes = todayTotalDuration % 60;
    const todayFormattedDuration = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

    return new Response(JSON.stringify({
      success: true,
      data: {
        isLoggedIn,
        activeSession: activeSession ? {
          id: activeSession._id,
          loginTime: activeSession.loginTime,
          ipAddress: activeSession.ipAddress,
          duration: activeSession.formattedDuration
        } : null,
        todaySummary: {
          totalSessions: todaySessions.length,
          totalDuration: todayTotalDuration,
          formattedDuration: todayFormattedDuration,
          sessions: todaySessions.map(session => ({
            id: session._id,
            loginTime: session.loginTime,
            logoutTime: session.logoutTime,
            duration: session.formattedDuration,
            status: session.status
          }))
        }
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Attendance status error:', error);
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