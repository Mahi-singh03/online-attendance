
// app/api/tasks/staff-list/route.js
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/DBconnection';
import Staff from '@/models/staff';
import { adminAuthMiddleware } from '@/lib/middleware/auth';

export async function GET(request) {
  try {
    await dbConnect();
    
    const auth = await adminAuthMiddleware(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const staffList = await Staff.find({}, 'name email _id');
    
    return NextResponse.json({ staffList });

  } catch (error) {
    console.error('Get staff list error:', error);
    return NextResponse.json(
      { error: 'Server error while fetching staff list' },
      { status: 500 }
    );
  }
}