// app/api/tasks/assign/route.js
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/DBconnection';
import Task from '@/models/task';
import Staff from "@/models/staff";
import { adminAuthMiddleware } from '@/lib/middleware/auth';

export async function POST(request) {
  try {
    await dbConnect();
    
    const auth = await adminAuthMiddleware(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const {
      title,
      description,
      assignedTo,
      priority,
      dueDate,
      estimatedHours,
      tags
    } = await request.json();

    // Validate required fields
    if (!title || !description || !assignedTo || !dueDate) {
      return NextResponse.json(
        { error: 'Title, description, assignedTo, and dueDate are required' },
        { status: 400 }
      );
    }

    // Check if staff exists
    const staff = await Staff.findById(assignedTo);
    if (!staff) {
      return NextResponse.json(
        { error: 'Staff member not found' },
        { status: 404 }
      );
    }

    // Validate due date is in future
    const dueDateObj = new Date(dueDate);
    if (dueDateObj <= new Date()) {
      return NextResponse.json(
        { error: 'Due date must be in the future' },
        { status: 400 }
      );
    }

    // Create task
    const task = new Task({
      title,
      description,
      assignedTo,
      assignedBy: auth.user.id,
      priority: priority || 'medium',
      dueDate: dueDateObj,
      estimatedHours: estimatedHours || undefined,
      tags: tags || []
    });

    const savedTask = await task.save();

    // Populate the task with staff and admin details for response
    const populatedTask = await Task.findById(savedTask._id)
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email');

    return NextResponse.json({
      message: 'Task assigned successfully',
      task: populatedTask
    }, { status: 201 });

  } catch (error) {
    console.error('Task assignment error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return NextResponse.json(
        { error: errors.join(', ') },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Server error during task assignment' },
      { status: 500 }
    );
  }
}