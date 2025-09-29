// pages/api/chat/send-message.js
import GroupMessage from '@/models/chat';
import Staff from '@/models/staff';
import Admin from '@/models/admin';
import dbConnect from '@/lib/DBconnection';
import { getSession } from 'next-auth/react';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await dbConnect();
    
    // Get user session (adjust based on your auth setup)
    const session = await getSession({ req });
    if (!session) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { message, messageType = 'text', fileUrl = null, fileName = null } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({ message: 'Message is required' });
    }

    // Find the sender (could be staff or admin)
    let sender = await Staff.findById(session.user.id);
    let senderModel = 'Staff';
    
    if (!sender) {
      sender = await Admin.findById(session.user.id);
      senderModel = 'Admin';
    }

    if (!sender) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Create new message
    const newMessage = await GroupMessage.create({
      sender: session.user.id,
      senderModel: senderModel,
      senderName: sender.name,
      message: message.trim(),
      messageType,
      fileUrl,
      fileName
    });

    // Populate the sender info for immediate response
    await newMessage.populate('sender', 'name email');

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: newMessage
    });

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error',
      error: error.message 
    });
  }
}