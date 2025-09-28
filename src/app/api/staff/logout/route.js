import dbConnect from '@/lib/DBconnection';
import StaffAttendance from '@/models/logTime';
import Staff from '@/models/staff';

export async function POST(req) {
  try {
    await dbConnect();

    const { staffId, attendanceId } = await req.json();
    
    if (!staffId) {
      return new Response(JSON.stringify({ 
        success: false,
        message: 'Staff ID is required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify staff exists
    const staff = await Staff.findById(staffId);
    if (!staff) {
      return new Response(JSON.stringify({ 
        success: false,
        message: 'Staff not found' 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let attendanceRecord;

    if (attendanceId) {
      // Logout specific attendance record
      attendanceRecord = await StaffAttendance.findOne({
        _id: attendanceId,
        staff: staffId
      });
    } else {
      // Logout current active session
      attendanceRecord = await StaffAttendance.findOne({
        staff: staffId,
        status: 'active',
        logoutTime: { $exists: false }
      });
    }

    if (!attendanceRecord) {
      return new Response(JSON.stringify({ 
        success: false,
        message: 'No active session found to logout' 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Record logout
    attendanceRecord.logLogout(new Date(), 'completed');
    await attendanceRecord.save();
    
    await attendanceRecord.populate('staff', 'name email');

    return new Response(JSON.stringify({
      success: true,
      message: 'Logout recorded successfully',
      attendance: {
        id: attendanceRecord._id,
        loginTime: attendanceRecord.loginTime,
        logoutTime: attendanceRecord.logoutTime,
        sessionDuration: attendanceRecord.sessionDuration,
        formattedDuration: attendanceRecord.formattedDuration,
        staff: {
          id: staff._id,
          name: staff.name,
          email: staff.email
        }
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Attendance logout error:', error);
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