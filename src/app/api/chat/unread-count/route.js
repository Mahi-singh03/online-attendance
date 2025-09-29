// pages/api/chat/unread-count.js
import GroupMessage from '@/models/chat';
import dbConnect from '@/lib/DBconnection';
import { getSession } from 'next-auth/react';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await dbConnect();
    
    const session = await getSession({ req });
    if (!session) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const unreadCount = await GroupMessage.getUnreadCount(
      session.user.id, 
      session.user.role === 'admin' ? 'Admin' : 'Staff'
    );

    res.status(200).json({
      success: true,
      data: {
        unreadCount
      }
    });

  } catch (error) {
    console.error('Unread count error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error',
      error: error.message 
    });
  }
}