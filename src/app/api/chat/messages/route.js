import GroupMessage from '@/models/chat';
import dbConnect from '@/lib/DBconnection';
import { getServerSession } from 'next-auth/next';

export async function GET(request) {
  try {
    await dbConnect();
    
    // Get user session (adjust based on your auth setup)
    const session = await getServerSession();
    if (!session) {
      return Response.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || 1;
    const limit = searchParams.get('limit') || 50;
    const markAsRead = searchParams.get('markAsRead') || false;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get total count for pagination
    const totalMessages = await GroupMessage.countDocuments();
    const totalPages = Math.ceil(totalMessages / limitNum);

    // Get messages with pagination, sorted by latest first
    const messages = await GroupMessage.find()
      .sort({ createdAt: -1 }) // Latest first
      .skip(skip)
      .limit(limitNum)
      .populate('sender', 'name email')
      .lean(); // Use lean for better performance

    // Reverse to show oldest first for display (optional)
    const messagesForDisplay = messages.reverse();

    // If markAsRead is true, mark all these messages as read for this user
    if (markAsRead === 'true') {
      const updatePromises = messages.map(message => {
        return GroupMessage.findByIdAndUpdate(
          message._id,
          {
            $addToSet: {
              readBy: {
                user: session.user.id,
                userModel: session.user.role === 'admin' ? 'Admin' : 'Staff',
                readAt: new Date()
              }
            }
          }
        );
      });
      await Promise.all(updatePromises);
    }

    return Response.json({
      success: true,
      data: {
        messages: messagesForDisplay,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalMessages,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1
        }
      }
    });

  } catch (error) {
    console.error('Get messages error:', error);
    return Response.json({ 
      success: false,
      message: 'Internal server error',
      error: error.message 
    }, { status: 500 });
  }
}