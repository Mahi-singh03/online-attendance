import GroupMessage from '@/models/chat';
import dbConnect from '@/lib/DBconnection';
import { authMiddleware } from '@/lib/middleware/auth';

export async function PUT(request) {
  try {
    await dbConnect();
    
    const authResult = await authMiddleware(request);
    if (authResult.error) {
      return Response.json({ message: authResult.error }, { status: authResult.status });
    }

    const { messageId } = await request.json();

    if (!messageId) {
      return Response.json({ message: 'Message ID is required' }, { status: 400 });
    }

    const message = await GroupMessage.findById(messageId);
    if (!message) {
      return Response.json({ message: 'Message not found' }, { status: 404 });
    }

    await message.markAsRead(authResult.user.id, authResult.user.type);

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