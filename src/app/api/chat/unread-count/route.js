import GroupMessage from '@/models/chat';
import dbConnect from '@/lib/DBconnection';
import { getServerSession } from 'next-auth/next';

export async function GET(request) {
  try {
    await dbConnect();
    
    const session = await getServerSession();
    if (!session) {
      return Response.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const unreadCount = await GroupMessage.getUnreadCount(
      session.user.id, 
      session.user.role === 'admin' ? 'Admin' : 'Staff'
    );

    return Response.json({
      success: true,
      data: {
        unreadCount
      }
    });

  } catch (error) {
    console.error('Unread count error:', error);
    return Response.json({ 
      success: false,
      message: 'Internal server error',
      error: error.message 
    }, { status: 500 });
  }
}