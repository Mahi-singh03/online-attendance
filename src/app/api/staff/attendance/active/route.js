import dbConnect from '@/lib/DBconnection';
import StaffAttendance from '@/models/logTime';
import { staffAuthMiddleware } from '@/lib/middleware/auth';

export async function GET(req) {
  try {
    await dbConnect();

    const authResult = await staffAuthMiddleware(req);
    if (authResult.error) {
      return new Response(JSON.stringify({
        success: false,
        message: authResult.error
      }), {
        status: authResult.status || 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const staffId = authResult.user.id;

    const activeSessions = await StaffAttendance.getActiveSessions(staffId);

    return new Response(JSON.stringify({
      success: true,
      data: activeSessions,
      count: activeSessions.length
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Get active sessions error:', error);
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