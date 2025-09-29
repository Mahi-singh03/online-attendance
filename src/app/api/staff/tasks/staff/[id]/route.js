// app/api/tasks/staff/[id]/route.js
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/DBconnection';
import Task from '@/models/task';
import { staffAuthMiddleware } from '@/lib/middleware/auth';

export async function GET(request, { params }) {
  try {
    await dbConnect();
    
    const auth = await staffAuthMiddleware(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const task = await Task.findOne({
      _id: params.id,
      assignedTo: auth.user.id
    })
      .populate('assignedBy', 'name email')
      .populate('comments.user', 'name email')
      .populate('statusHistory.changedBy', 'name email');

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({ task });

  } catch (error) {
    console.error('Get staff task error:', error);
    
    if (error.kind === 'ObjectId') {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Server error while fetching task' },
      { status: 500 }
    );
  }
}