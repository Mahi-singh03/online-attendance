import { NextResponse } from 'next/server';
import dbConnect from '@/lib/DBconnection';
import StaffAttendance from '@/models/logTime';

export async function GET() {
  try {
    await dbConnect();

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const logs = await StaffAttendance.find({
      loginTime: { $gte: startOfDay, $lte: endOfDay }
    })
      .populate('staff', 'name email')
      .sort({ loginTime: -1 })
      .limit(50)
      .lean();

    return NextResponse.json({
      success: true,
      data: logs.map(l => ({
        id: l._id,
        staffName: l.staff?.name || 'Unknown',
        loginTime: l.loginTime,
        logoutTime: l.logoutTime,
        status: l.status
      })),
      count: logs.length
    });
  } catch (error) {
    console.error('todayLogs error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}


