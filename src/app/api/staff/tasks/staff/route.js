// app/api/tasks/staff/route.js
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/DBconnection';
import Task from '@/models/task';
import { staffAuthMiddleware } from '@/lib/middleware/auth';

export async function GET(request) {
  try {
    await dbConnect();
    
    const auth = await staffAuthMiddleware(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const includeCompleted = searchParams.get('includeCompleted') !== 'false';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build query - only tasks assigned to this staff member
    const query = { assignedTo: auth.user.id };
    
    // Status filter
    if (status && status !== 'all') {
      query.status = status;
    } else if (!includeCompleted) {
      query.status = { $ne: 'completed' };
    }
    
    // Priority filter
    if (priority && priority !== 'all') {
      query.priority = priority;
    }

    // Exclude tasks scheduled for deletion
    const andConditions = [{
      $or: [
        { retentionPeriod: { $ne: 'completed-storage' } },
        { 
          retentionPeriod: 'completed-storage',
          scheduledDeletionDate: { $gt: new Date() }
        }
      ]
    }];

    // Combine all conditions
    if (andConditions.length > 0) {
      query.$and = andConditions;
    }

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const tasks = await Task.find(query)
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
    console.error('Get staff tasks error:', error);
    return NextResponse.json(
      { error: 'Server error while fetching tasks' },
      { status: 500 }
    );
  }
}