import GroupMessage from '@/models/chat';
import dbConnect from '@/lib/DBconnection';
import { authMiddleware } from '@/lib/middleware/auth';

export async function GET(request) {
  try {
    await dbConnect();
    
    const authResult = await authMiddleware(request);
    if (authResult.error) {
      return Response.json({ message: authResult.error }, { status: authResult.status });
    }

    const unreadCount = await GroupMessage.getUnreadCount(
      authResult.user.id, 
      authResult.user.type
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