import dbConnect from '@/lib/DBconnection';
import StaffAttendance from '@/models/logTime';
import Staff from '@/models/staff';
import { getClientIP, validateIP } from '@/lib/ipUtils';

export async function POST(req) {
  try {
    await dbConnect();

    const { staffId } = await req.json();
    
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

    const clientIP = getClientIP(req);
    const userAgent = req.headers.get('user-agent') || 'Unknown';
    
    // Check if staff has IP restrictions
    if (staff.allowedIps && staff.allowedIps.length > 0) {
      const isAllowed = validateIP(clientIP, staff.allowedIps);
      if (!isAllowed) {
        return new Response(JSON.stringify({ 
          success: false,
          message: 'Login not allowed from this network',
          clientIP 
        }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // Check for existing active session
    const activeSession = await StaffAttendance.findOne({
      staff: staffId,
      status: 'active',
      logoutTime: { $exists: false }
    });

    if (activeSession) {
      // Auto-logout previous session if it exists
      activeSession.logLogout(new Date(), 'system-logout');
      await activeSession.save();
    }

    // Create new attendance record
    const now = new Date();
    const attendanceRecord = new StaffAttendance({
      staff: staffId,
      ipAddress: clientIP,
      userAgent: userAgent,
      status: 'active',
      loginTime: now,
      // Set auto deletion date to 15th of the month, 3 months from now
      autoDeleteDate: (() => {
        const deleteDate = new Date(now);
        deleteDate.setMonth(deleteDate.getMonth() + 3);
        deleteDate.setDate(15); // Set to 15th of the month
        deleteDate.setHours(23, 59, 59, 999); // End of day
        return deleteDate;
      })(),
      // Set monthYear for easy querying (format: YYYY-MM)
      monthYear: (() => {
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        return `${year}-${month}`;
      })()
    });

    await attendanceRecord.save();
    
    // Populate the record for response
    await attendanceRecord.populate('staff', 'name email');

    return new Response(JSON.stringify({
      success: true,
      message: 'Login recorded successfully',
      attendance: {
        id: attendanceRecord._id,
        loginTime: attendanceRecord.loginTime,
        staff: {
          id: staff._id,
          name: staff.name,
          email: staff.email
        },
        ipAddress: clientIP
      }
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Attendance login error:', error);
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