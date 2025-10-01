import { NextResponse } from 'next/server';
import dbConnect from '@/lib/DBconnection';
import Task from '@/models/task';

export async function GET() {
  try {
    await dbConnect();

    const tasks = await Task.find({})
      .populate('assignedTo', 'name')
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    return NextResponse.json({
      success: true,
      data: tasks.map(t => ({
        _id: t._id,
        title: t.title,
        description: t.description,
        status: t.status,
        priority: t.priority,
        dueDate: t.dueDate,
        assignedTo: t.assignedTo ? { name: t.assignedTo.name } : null
      }))
    });
  } catch (error) {
    console.error('assigned tasks error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}


