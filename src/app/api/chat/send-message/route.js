import GroupMessage from '@/models/chat';
import Staff from '@/models/staff';
import Admin from '@/models/admin';
import dbConnect from '@/lib/DBconnection';
import { authMiddleware } from '@/lib/middleware/auth';

export async function POST(request) {
  try {
    await dbConnect();
    
    const authResult = await authMiddleware(request);
    if (authResult.error) {
      return Response.json({ message: authResult.error }, { status: authResult.status });
    }

    const { message, messageType = 'text', fileUrl = null, fileName = null } = await request.json();

    if (!message || message.trim() === '') {
      return Response.json({ message: 'Message is required' }, { status: 400 });
    }

    // Find the sender (could be staff or admin)
    let sender = await Staff.findById(authResult.user.id);
    let senderModel = 'Staff';
    
    if (!sender) {
      sender = await Admin.findById(authResult.user.id);
      senderModel = 'Admin';
    }

    if (!sender) {
      return Response.json({ message: 'User not found' }, { status: 404 });
    }

    // Create new message
    const newMessage = await GroupMessage.create({
      sender: authResult.user.id,
      senderModel: senderModel,
      senderName: sender.name,
      message: message.trim(),
      messageType,
      fileUrl,
      fileName
    });

    // Populate the sender info for immediate response
    await newMessage.populate('sender', 'name email');

    return Response.json({
      success: true,
      message: 'Message sent successfully',
      data: newMessage
    }, { status: 201 });

  } catch (error) {
    console.error('Send message error:', error);
    return Response.json({ 
      success: false,
      message: 'Internal server error',
      error: error.message 
    }, { status: 500 });
  }
}