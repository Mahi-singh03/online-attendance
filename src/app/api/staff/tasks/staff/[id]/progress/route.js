// app/api/tasks/staff/[id]/progress/route.js
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/DBconnection';
import Task from '@/models/task';
import { staffAuthMiddleware } from '@/lib/middleware/auth';

export async function PUT(request, { params }) {
  try {
    await dbConnect();
    
    const auth = await staffAuthMiddleware(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { progress, comment } = await request.json();

    if (progress === undefined || progress === null) {
      return NextResponse.json(
        { error: 'Progress is required' },
        { status: 400 }
      );
    }

    const task = await Task.findOne({
      _id: params.id,
      assignedTo: auth.user.id
    });

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found or access denied' },
        { status: 404 }
      );
    }

    // Update progress using the model method
    task.updateProgress(progress, comment, auth.user.id, 'Staff');

    const updatedTask = await task.save();
    const populatedTask = await Task.findById(updatedTask._id)
      .populate('assignedBy', 'name email');

    return NextResponse.json({
      message: 'Progress updated successfully',
      task: populatedTask
    });

  } catch (error) {
    console.error('Update progress error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return NextResponse.json(
        { error: errors.join(', ') },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Server error while updating progress' },
      { status: 500 }
    );
  }
}