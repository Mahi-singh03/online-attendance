"use client"
// components/GroupChat.jsx
import { useState, useEffect, useRef } from 'react';
import { 
  PaperAirplaneIcon, 
  PhotoIcon, 
  DocumentIcon,
  CheckIcon,
  CheckBadgeIcon,
  FaceSmileIcon
} from '@heroicons/react/24/outline';
import { EmojiPickerComponent } from './EmojiPicker'; // You'll need to install emoji-picker-react

const GroupChat = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [authToken, setAuthToken] = useState(null);
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Get auth token on component mount
  useEffect(() => {
    const getAuthToken = () => {
      // Try staff token first
      const staffSession = localStorage.getItem('staffSession');
      const staffToken = localStorage.getItem('staffToken');
      const adminToken = localStorage.getItem('adminToken');
      
      if (staffSession) {
        try {
          const session = JSON.parse(staffSession);
          setAuthToken(session.token || staffToken);
        } catch (error) {
          console.error('Error parsing staff session:', error);
        }
      } else if (adminToken) {
        setAuthToken(adminToken);
      }
    };
    
    getAuthToken();
  }, []);

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load messages
  const loadMessages = async (page = 1, markAsRead = false) => {
    try {
      setIsLoading(true);
      const headers = {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
      };
      
      const response = await fetch(`/api/chat/messages?page=${page}&limit=20&markAsRead=${markAsRead}`, {
        headers
      });
      const result = await response.json();
      
      if (result.success) {
        if (page === 1) {
          setMessages(result.data.messages);
        } else {
          setMessages(prev => [...result.data.messages, ...prev]);
        }
        setCurrentPage(result.data.pagination.currentPage);
        setHasMore(result.data.pagination.hasNext);
        
        // Update unread count
        await fetchUnreadCount();
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch unread count
  const fetchUnreadCount = async () => {
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
      };
      
      const response = await fetch('/api/chat/unread-count', {
        headers
      });
      const result = await response.json();
      if (result.success) {
        setUnreadCount(result.data.unreadCount);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  // Send message
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    try {
      setIsSending(true);
      const headers = {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
      };
      
      const response = await fetch('/api/chat/send-message', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: newMessage,
          messageType: 'text'
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setNewMessage('');
        setMessages(prev => [...prev, result.data]);
        setTimeout(scrollToBottom, 100);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
      setShowEmojiPicker(false);
    }
  };

  // Mark message as read
  const markAsRead = async (messageId) => {
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
      };
      
      await fetch('/api/chat/mark-read', {
        method: 'PUT',
        headers,
        body: JSON.stringify({ messageId }),
      });
      
      // Update local state
      setMessages(prev => prev.map(msg => 
        msg._id === messageId 
          ? { ...msg, readBy: [...(msg.readBy || []), { user: 'current-user' }] }
          : msg
      ));
      
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  // Handle file upload
  const handleFileUpload = async (file, type) => {
    try {
      setIsSending(true);
      
      // First upload the file
      const formData = new FormData();
      formData.append('file', file);
      
      const uploadHeaders = {
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
      };
      
      const uploadResponse = await fetch('/api/chat/upload', {
        method: 'POST',
        headers: uploadHeaders,
        body: formData,
      });

      const uploadResult = await uploadResponse.json();
      
      if (!uploadResult.success) {
        throw new Error(uploadResult.message || 'Upload failed');
      }

      // Then send the message with the uploaded file
      const messageHeaders = {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
      };
      
      const response = await fetch('/api/chat/send-message', {
        method: 'POST',
        headers: messageHeaders,
        body: JSON.stringify({
          message: type === 'image' ? '📷 Image' : `📎 ${uploadResult.data.fileName}`,
          messageType: type,
          fileUrl: uploadResult.data.fileUrl,
          fileName: uploadResult.data.fileName
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setMessages(prev => [...prev, result.data]);
        setTimeout(scrollToBottom, 100);
      } else {
        throw new Error(result.message || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending file message:', error);
      alert(`Error uploading file: ${error.message}`);
    } finally {
      setIsSending(false);
    }
  };

  // Handle scroll for infinite loading
  const handleScroll = (e) => {
    const { scrollTop } = e.target;
    if (scrollTop === 0 && hasMore && !isLoading) {
      loadMessages(currentPage + 1);
    }
  };

  // Add emoji to message
  const addEmoji = (emoji) => {
    setNewMessage(prev => prev + emoji.emoji);
  };

  // Initial load
  useEffect(() => {
    if (authToken) {
      loadMessages(1, true);
    }
  }, [authToken]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages.length]);

  // Format time
  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Check if message is read by current user
  const isMessageRead = (message) => {
    // Implement based on your readBy logic
    return message.readBy && message.readBy.length > 0;
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto bg-white shadow-xl rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Group Chat</h1>
            <p className="text-blue-100 text-sm">
              {unreadCount > 0 ? `${unreadCount} unread messages` : 'All messages read'}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm">Online</span>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div 
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50"
      >
        {isLoading && currentPage === 1 && (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={message._id}
            className={`flex ${message.senderModel === 'Admin' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md rounded-2xl px-4 py-2 transition-all duration-300 transform hover:scale-105 ${
                message.senderModel === 'Admin'
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : 'bg-white text-gray-800 rounded-bl-none shadow-md'
              }`}
              onMouseEnter={() => {
                if (!isMessageRead(message)) {
                  markAsRead(message._id);
                }
              }}
            >
              {/* Sender Info */}
              <div className={`text-xs font-semibold mb-1 ${
                message.senderModel === 'Admin' ? 'text-blue-100' : 'text-blue-600'
              }`}>
                {message.senderName}
                {message.senderModel === 'Admin' && (
                  <span className="ml-1 text-yellow-300">👑</span>
                )}
              </div>

              {/* Message Content */}
              {message.messageType === 'text' && (
                <p className="text-sm whitespace-pre-wrap break-words">{message.message}</p>
              )}
              
              {message.messageType === 'image' && (
                <div className="space-y-2">
                  <img 
                    src={message.fileUrl} 
                    alt="Shared image" 
                    className="rounded-lg max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => window.open(message.fileUrl, '_blank')}
                  />
                  <p className="text-sm">{message.message}</p>
                </div>
              )}
              
              {message.messageType === 'file' && (
                <div 
                  className="flex items-center space-x-2 p-2 bg-black bg-opacity-10 rounded-lg cursor-pointer hover:bg-opacity-20 transition-colors"
                  onClick={() => window.open(message.fileUrl, '_blank')}
                >
                  <DocumentIcon className="w-5 h-5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{message.fileName}</p>
                    <p className="text-xs opacity-75">Click to download</p>
                  </div>
                </div>
              )}

              {/* Message Footer */}
              <div className={`flex items-center justify-between mt-1 text-xs ${
                message.senderModel === 'Admin' ? 'text-blue-200' : 'text-gray-500'
              }`}>
                <span>{formatTime(message.createdAt)}</span>
                <div className="flex items-center space-x-1">
                  {isMessageRead(message) ? (
                    <CheckBadgeIcon className="w-4 h-4 text-green-400" />
                  ) : (
                    <CheckIcon className="w-4 h-4" />
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {isLoading && currentPage > 1 && (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t bg-white p-4">
        <form onSubmit={sendMessage} className="flex space-x-2">
          {/* File Upload Buttons */}
          <div className="flex space-x-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
              title="Upload image"
            >
              <PhotoIcon className="w-5 h-5" />
            </button>
            
            <button
              type="button"
              onClick={() => document.getElementById('fileInput')?.click()}
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
              title="Upload file"
            >
              <DocumentIcon className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
              title="Add emoji"
            >
              <FaceSmileIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Hidden file inputs */}
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files[0];
              if (file) handleFileUpload(file, 'image');
            }}
          />
          <input
            type="file"
            id="fileInput"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files[0];
              if (file) handleFileUpload(file, 'file');
            }}
          />

          {/* Message Input */}
          <div className="flex-1 relative">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(e);
                }
              }}
            />
            
            {/* Emoji Picker */}
            {showEmojiPicker && (
              <div className="absolute bottom-full mb-2 left-0 z-10">
                <EmojiPickerComponent onEmojiClick={addEmoji} />
              </div>
            )}
          </div>

          {/* Send Button */}
          <button
            type="submit"
            disabled={!newMessage.trim() || isSending}
            className={`p-3 rounded-full transition-all duration-200 ${
              newMessage.trim() && !isSending
                ? 'bg-blue-600 hover:bg-blue-700 text-white transform hover:scale-105'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isSending ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <PaperAirplaneIcon className="w-5 h-5" />
            )}
          </button>
        </form>
      </div>

      {/* Typing Indicator (optional) */}
      <div className="px-4 py-2 bg-gray-100 border-t">
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
          <span>Someone is typing...</span>
        </div>
      </div>
    </div>
  );
};

export default GroupChat;