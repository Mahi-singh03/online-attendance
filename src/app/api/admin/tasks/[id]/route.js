// app/api/tasks/admin/[id]/route.js
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/DBconnection';
import Task from '@/models/task';
import { adminAuthMiddleware } from '@/lib/middleware/auth';

export async function GET(request, { params }) {
  try {
    await dbConnect();
    
    const auth = await adminAuthMiddleware(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const task = await Task.findById(params.id)
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email')
      .populate('comments.user', 'name email')
      .populate('statusHistory.changedBy', 'name email');

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ task });

  } catch (error) {
    console.error('Get task error:', error);
    
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

export async function PUT(request, { params }) {
  try {
    await dbConnect();
    
    const auth = await adminAuthMiddleware(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const {
      title,
      description,
      priority,
      dueDate,
      estimatedHours,
      tags,
      status,
      rejectionReason
    } = await request.json();

    const task = await Task.findById(params.id);
    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // Update fields if provided
    if (title) task.title = title;
    if (description) task.description = description;
    if (priority) task.priority = priority;
    if (dueDate) {
      const dueDateObj = new Date(dueDate);
      if (dueDateObj <= new Date()) {
        return NextResponse.json(
          { error: 'Due date must be in the future' },
          { status: 400 }
        );
      }
      task.dueDate = dueDateObj;
    }
    if (estimatedHours !== undefined) task.estimatedHours = estimatedHours;
    if (tags) task.tags = tags;

    // Handle status changes
    if (status && status !== task.status) {
      if (status === 'rejected' && !rejectionReason) {
        return NextResponse.json(
          { error: 'Rejection reason is required for rejecting tasks' },
          { status: 400 }
        );
      }

      if (status === 'rejected') {
        task.rejectTask(rejectionReason, auth.user.id, 'Task rejected by admin');
      } else {
        task.updateStatus(status, auth.user.id, 'Admin', `Status updated by admin to ${status}`);
      }
    }

    const updatedTask = await task.save();
    const populatedTask = await Task.findById(updatedTask._id)
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email');

    return NextResponse.json({
      message: 'Task updated successfully',
      task: populatedTask
    });

  } catch (error) {
    console.error('Update task error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return NextResponse.json(
        { error: errors.join(', ') },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Server error while updating task' },
      { status: 500 }
    );
  }
}