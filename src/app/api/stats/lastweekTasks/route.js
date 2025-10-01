import { NextResponse } from 'next/server';
import dbConnect from '@/lib/DBconnection';
import StaffAttendance from '@/models/logTime';

export async function GET(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '30');
    const staffId = searchParams.get('staffId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const status = searchParams.get('status');
    const monthYear = searchParams.get('monthYear');

    const query = {};

    if (staffId) {
      query.staff = staffId;
    }

    if (startDate || endDate) {
      query.loginTime = {};
      if (startDate) query.loginTime.$gte = new Date(startDate);
      if (endDate) query.loginTime.$lte = new Date(endDate);
    }

    if (status) {
      query.status = status;
    }

    if (monthYear) {
      query.monthYear = monthYear;
    }

    const skip = (page - 1) * limit;

    const attendance = await StaffAttendance.find(query)
      .populate('staff', 'name email role')
      .sort({ loginTime: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const formattedAttendance = attendance.map(record => ({
      id: record._id,
      staff: record.staff ? {
        id: record.staff._id,
        name: record.staff.name,
        email: record.staff.email,
        role: record.staff.role
      } : null,
      loginTime: record.loginTime,
      logoutTime: record.logoutTime,
      sessionDuration: record.sessionDuration,
      formattedDuration: record.formattedDuration,
      status: record.status,
      ipAddress: record.ipAddress,
      deviceInfo: record.deviceInfo,
      location: record.location,
      isActive: record.isActive
    }));

    const total = await StaffAttendance.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: formattedAttendance,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching staff attendance:', error);
    return NextResponse.json({
      success: false,
      message: 'Error fetching staff attendance records',
      error: error.message
    }, { status: 500 });
  }
}