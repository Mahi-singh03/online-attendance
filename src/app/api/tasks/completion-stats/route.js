import { NextResponse } from 'next/server';
import dbConnect from '@/lib/DBconnection';
import Task from '@/models/task';

export async function GET(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const startParam = searchParams.get('startDate');
    const startDate = startParam ? new Date(startParam) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const query = { createdAt: { $gte: startDate } };

    const [totalTasks, completedTasks, inProgressTasks, pendingTasks, overdueTasks] = await Promise.all([
      Task.countDocuments(query),
      Task.countDocuments({ ...query, status: 'completed' }),
      Task.countDocuments({ ...query, status: 'in-progress' }),
      Task.countDocuments({ ...query, status: 'pending' }),
      Task.countDocuments({
        ...query,
        status: { $in: ['pending', 'in-progress'] },
        dueDate: { $lt: new Date() }
      })
    ]);

    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return NextResponse.json({
      success: true,
      data: {
        totalTasks,
        completedTasks,
        inProgressTasks,
        pendingTasks,
        overdueTasks,
        completionRate
      }
    });
  } catch (error) {
    console.error('completion-stats error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}


