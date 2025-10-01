// app/api/tasks/admin/route.js
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/DBconnection';
import Task from "@/models/task";
import { adminAuthMiddleware } from '@/lib/middleware/auth';

export async function GET(request) {
  try {
    await dbConnect();
    
    const auth = await adminAuthMiddleware(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const assignedTo = searchParams.get('assignedTo');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build query
    const query = {};
    
    // Status filter
    if (status && status !== 'all') {
      query.status = status;
    }
    
    // Priority filter
    if (priority && priority !== 'all') {
      query.priority = priority;
    }
    
    // Assigned to filter
    if (assignedTo && assignedTo !== 'all') {
      query.assignedTo = assignedTo;
    }
    
    // Build complex query with $and for multiple conditions
    const andConditions = [];
    
    // Search filter (title or description)
    if (search) {
      andConditions.push({
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ]
      });
    }

    // Exclude tasks scheduled for deletion
    andConditions.push({
      $or: [
        { retentionPeriod: { $ne: 'completed-storage' } },
        { 
          retentionPeriod: 'completed-storage',
          scheduledDeletionDate: { $gt: new Date() }
        }
      ]
    });

    // Combine all conditions
    if (andConditions.length > 0) {
      query.$and = andConditions;
    }

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email')
      .sort(sortOptions)
      .limit(limit)
      .skip((page - 1) * limit)
      .exec();

    // Get total count for pagination
    const total = await Task.countDocuments(query);

    return NextResponse.json({
      tasks,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalTasks: total
    });

  } catch (error) {
    console.error('Get tasks error:', error);
    return NextResponse.json(
      { error: 'Server error while fetching tasks' },
      { status: 500 }
    );
  }
}

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
      priority = 'medium',
      dueDate,
      estimatedHours,
      tags
    } = await request.json();

    if (!title || !description || !assignedTo || !dueDate) {
      return NextResponse.json(
        { error: 'title, description, assignedTo and dueDate are required' },
        { status: 400 }
      );
    }

    const dueDateObj = new Date(dueDate);
    if (!(dueDateObj instanceof Date) || isNaN(dueDateObj.getTime()) || dueDateObj <= new Date()) {
      return NextResponse.json(
        { error: 'Due date must be a valid future date' },
        { status: 400 }
      );
    }

    const newTask = new Task({
      title,
      description,
      assignedTo,
      assignedBy: auth.user.id,
      priority,
      dueDate: dueDateObj,
      estimatedHours: estimatedHours !== undefined ? Number(estimatedHours) : undefined,
      tags: Array.isArray(tags) ? tags : (typeof tags === 'string' && tags.trim() !== '' ? tags.split(',').map(t => t.trim()).filter(Boolean) : undefined)
    });

    await newTask.save();

    const populatedTask = await Task.findById(newTask._id)
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email');

    return NextResponse.json({
      message: 'Task created successfully',
      task: populatedTask
    }, { status: 201 });

  } catch (error) {
    console.error('Create task error:', error);
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return NextResponse.json(
        { error: errors.join(', ') },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Server error while creating task' },
      { status: 500 }
    );
  }
}