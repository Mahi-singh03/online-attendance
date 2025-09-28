import dbConnect from '@/lib/DBconnection';
import StaffAttendance from '@/models/logTime';

export async function GET(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const staffId = searchParams.get('staffId');
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 30;
    const monthYear = searchParams.get('monthYear');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!staffId) {
      return new Response(JSON.stringify({ 
        success: false,
        message: 'Staff ID is required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Build query
    const query = { staff: staffId };
    
    if (monthYear) {
      query.monthYear = monthYear;
    }
    
    if (startDate && endDate) {
      query.loginTime = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const skip = (page - 1) * limit;
    
    // Get attendance records
    const attendanceRecords = await StaffAttendance.find(query)
      .sort({ loginTime: -1 })
      .skip(skip)
      .limit(limit)
      .populate('staff', 'name email');

    // Get total count for pagination
    const totalRecords = await StaffAttendance.countDocuments(query);
    const totalPages = Math.ceil(totalRecords / limit);

    // Get monthly summary if monthYear is provided
    let monthlySummary = null;
    if (monthYear) {
      const [year, month] = monthYear.split('-');
      const summary = await StaffAttendance.getMonthlySummary(staffId, year, month);
      monthlySummary = summary.length > 0 ? summary[0] : null;
    }

    return new Response(JSON.stringify({
      success: true,
      data: {
        attendance: attendanceRecords.map(record => ({
          id: record._id,
          loginTime: record.loginTime,
          logoutTime: record.logoutTime,
          sessionDuration: record.sessionDuration,
          formattedDuration: record.formattedDuration,
          ipAddress: record.ipAddress,
          status: record.status,
          isActive: record.isActive
        })),
        pagination: {
          currentPage: page,
          totalPages,
          totalRecords,
          hasNext: page < totalPages,
          hasPrev: page > 1
        },
        summary: monthlySummary
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Attendance history error:', error);
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