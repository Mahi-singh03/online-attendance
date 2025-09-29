// pages/api/chat/mark-read.js
import GroupMessage from '@/models/chat';
import dbConnect from '@/lib/DBconnection';
import { getSession } from 'next-auth/react';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await dbConnect();
    
    const session = await getSession({ req });
    if (!session) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { messageId } = req.body;

    if (!messageId) {
      return res.status(400).json({ message: 'Message ID is required' });
    }

    const message = await GroupMessage.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    await message.markAsRead(session.user.id, session.user.role === 'admin' ? 'Admin' : 'Staff');

    res.status(200).json({
      success: true,
      message: 'Message marked as read'
    });

  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error',
      error: error.message 
    });
  }
}