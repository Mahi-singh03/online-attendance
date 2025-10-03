import GroupMessage from '@/models/chat';
import dbConnect from '@/lib/DBconnection';
import { getServerSession } from 'next-auth/next';

export async function PUT(request) {
  try {
    await dbConnect();
    
    const session = await getServerSession();
    if (!session) {
      return Response.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { messageId } = await request.json();

    if (!messageId) {
      return Response.json({ message: 'Message ID is required' }, { status: 400 });
    }

    const message = await GroupMessage.findById(messageId);
    if (!message) {
      return Response.json({ message: 'Message not found' }, { status: 404 });
    }

    await message.markAsRead(session.user.id, session.user.role === 'admin' ? 'Admin' : 'Staff');

    return Response.json({
      success: true,
      message: 'Message marked as read'
    });

  } catch (error) {
    console.error('Mark as read error:', error);
    return Response.json({ 
      success: false,
      message: 'Internal server error',
      error: error.message 
    }, { status: 500 });
  }
}