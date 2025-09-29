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