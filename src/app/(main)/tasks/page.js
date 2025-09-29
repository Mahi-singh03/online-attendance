// app/page.js
'use client';
import { useState, useEffect } from 'react';

export default function TaskManager() {
  const [activeTab, setActiveTab] = useState('admin');
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

  // Form state
  const [assignForm, setAssignForm] = useState({
    title: '',
    description: '',
    assignedTo: '',
    priority: 'medium',
    dueDate: '',
    estimatedHours: '',
    tags: ''
  });

  // Show notification
  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
  };

  // Get auth token
  const getToken = () => localStorage.getItem('token');

  // API call function
  const apiCall = async (url, options = {}) => {
    const token = getToken();
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'API error' }));
      throw new Error(errorData.error || `API error: ${response.status}`);
    }
    
    return response.json();
  };

  // Simulate login - replace with actual login API
  const handleLogin = async (role) => {
    setLoading(true);
    try {
      // Mock login - in real app, you'd call your authentication API
      let userData;
      if (role === 'admin') {
        userData = { 
          id: '1', 
          name: 'Admin User', 
          email: 'admin@company.com', 
          type: 'Admin' 
        };
      } else {
        // For staff, you'd typically get this from your actual login API
        userData = { 
          id: '2',  // This should match the staff ID in your database
          name: 'John Doe', 
          email: 'john@company.com', 
          type: 'Staff' 
        };
      }
      
      localStorage.setItem('token', 'mock-jwt-token');
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      
      // Load data based on role
      if (role === 'admin') {
        await loadAdminData();
        setActiveTab('admin');
      } else {
        await loadStaffData();
        setActiveTab('staff');
      }
      
      showNotification(`Welcome back, ${userData.name}!`, 'success');
    } catch (error) {
      showNotification('Login failed: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Load admin data
  const loadAdminData = async () => {
    try {
      setLoading(true);
      // Load tasks and staff list for admin
      const [tasksData, staffData] = await Promise.all([
        apiCall('/api/tasks/admin'),
        apiCall('/api/tasks/staff-list')
      ]);
      
      setTasks(tasksData.tasks || []);
      setStaffList(staffData.staffList || []);
    } catch (error) {
      console.error('Admin data load error:', error);
      showNotification('Failed to load admin data: ' + error.message, 'error');
      // Fallback to empty data
      setTasks([]);
      setStaffList([]);
    } finally {
      setLoading(false);
    }
  };

  // Load staff data - ONLY their own tasks
  const loadStaffData = async () => {
    try {
      setLoading(true);
      const tasksData = await apiCall('/api/tasks/staff');
      setTasks(tasksData.tasks || []);
    } catch (error) {
      console.error('Staff data load error:', error);
      showNotification('Failed to load your tasks: ' + error.message, 'error');
      // Fallback to empty data
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  // Assign task (Admin only)
  const handleAssignTask = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      // Validate form
      if (!assignForm.title || !assignForm.description || !assignForm.assignedTo || !assignForm.dueDate) {
        showNotification('Please fill all required fields', 'error');
        return;
      }

      // Validate due date
      const dueDate = new Date(assignForm.dueDate);
      if (dueDate <= new Date()) {
        showNotification('Due date must be in the future', 'error');
        return;
      }

      const result = await apiCall('/api/tasks/assign', {
        method: 'POST',
        body: JSON.stringify(assignForm)
      });
      
      // Add the new task to the local state
      setTasks(prev => [result.task, ...prev]);
      setShowAssignModal(false);
      setAssignForm({
        title: '',
        description: '',
        assignedTo: '',
        priority: 'medium',
        dueDate: '',
        estimatedHours: '',
        tags: ''
      });
      
      showNotification('Task assigned successfully!', 'success');
    } catch (error) {
      showNotification('Failed to assign task: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Update task progress (Staff only)
  const handleUpdateProgress = async (taskId, progress) => {
    try {
      const result = await apiCall(`/api/tasks/staff/${taskId}/progress`, {
        method: 'PUT',
        body: JSON.stringify({ progress })
      });
      
      // Update local state with the updated task
      setTasks(prev => prev.map(task => 
        task._id === taskId ? result.task : task
      ));
      
      showNotification('Progress updated successfully!', 'success');
    } catch (error) {
      showNotification('Failed to update progress: ' + error.message, 'error');
    }
  };

  // Update task status (Staff only)
  const handleUpdateStatus = async (taskId, status) => {
    try {
      // For status changes, we'll use the progress endpoint or a dedicated status endpoint
      // Since we don't have a dedicated status endpoint, we'll use progress for demo
      if (status === 'completed') {
        await handleUpdateProgress(taskId, 100);
      } else if (status === 'in-progress') {
        await handleUpdateProgress(taskId, 25); // Start with 25% when moving to in-progress
      }
    } catch (error) {
      showNotification('Failed to update status: ' + error.message, 'error');
    }
  };

  // Add comment to task (Staff only)
  const handleAddComment = async (taskId, comment) => {
    try {
      const result = await apiCall(`/api/tasks/staff/${taskId}/comment`, {
        method: 'POST',
        body: JSON.stringify({ comment })
      });
      
      // Update local state with the updated task
      setTasks(prev => prev.map(task => 
        task._id === taskId ? result.task : task
      ));
      
      showNotification('Comment added successfully!', 'success');
    } catch (error) {
      showNotification('Failed to add comment: ' + error.message, 'error');
    }
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setTasks([]);
    setStaffList([]);
    showNotification('Logged out successfully', 'success');
  };

  // Load user on component mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      const user = JSON.parse(userData);
      setUser(user);
      if (user.type === 'Admin') {
        loadAdminData();
        setActiveTab('admin');
      } else {
        loadStaffData();
        setActiveTab('staff');
      }
    }
  }, []);

  // Status badge component
  const StatusBadge = ({ status }) => {
    const statusConfig = {
      'pending': { class: 'bg-yellow-100 text-yellow-800', label: 'Pending', icon: '⏳' },
      'in-progress': { class: 'bg-blue-100 text-blue-800', label: 'In Progress', icon: '🚀' },
      'completed': { class: 'bg-green-100 text-green-800', label: 'Completed', icon: '✅' },
      'rejected': { class: 'bg-red-100 text-red-800', label: 'Rejected', icon: '❌' },
      'cancelled': { class: 'bg-gray-100 text-gray-800', label: 'Cancelled', icon: '🔴' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.class}`}>
        <span className="mr-1">{config.icon}</span>
        {config.label}
      </span>
    );
  };

  // Priority badge component
  const PriorityBadge = ({ priority }) => {
    const priorityConfig = {
      'low': { class: 'bg-gray-100 text-gray-800', label: 'Low', icon: '🔽' },
      'medium': { class: 'bg-blue-100 text-blue-800', label: 'Medium', icon: '🔼' },
      'high': { class: 'bg-orange-100 text-orange-800', label: 'High', icon: '⚠️' },
      'urgent': { class: 'bg-red-100 text-red-800', label: 'Urgent', icon: '🚨' }
    };
    
    const config = priorityConfig[priority] || priorityConfig.medium;
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.class}`}>
        <span className="mr-1">{config.icon}</span>
        {config.label}
      </span>
    );
  };

  // Progress bar component
  const ProgressBar = ({ progress, size = 'md' }) => {
    const height = size === 'sm' ? 'h-2' : size === 'lg' ? 'h-4' : 'h-3';
    const progressColor = progress === 100 ? 'from-green-500 to-green-600' : 'from-blue-500 to-blue-600';
    
    return (
      <div className="w-full bg-gray-200 rounded-full">
        <div 
          className={`bg-gradient-to-r ${progressColor} ${height} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    );
  };

  // Loading spinner component
  const LoadingSpinner = () => (
    <div className="flex items-center justify-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );

  // Comment modal component
  const CommentModal = ({ taskId, onClose, onSubmit }) => {
    const [comment, setComment] = useState('');
    
    const handleSubmit = (e) => {
      e.preventDefault();
      if (comment.trim()) {
        onSubmit(taskId, comment.trim());
        setComment('');
        onClose();
      }
    };

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform animate-scale-in">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-900">Add Comment</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Comment
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows="4"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                placeholder="Enter your comment..."
                required
              />
            </div>
            
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 px-4 rounded-xl font-medium transition-all duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl font-medium transition-all duration-200"
              >
                Add Comment
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // State for comment modal
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [selectedTaskForComment, setSelectedTaskForComment] = useState(null);

  // Login screen
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100 flex items-center justify-center p-4">
        {/* Notification */}
        {notification.show && (
          <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 ${
            notification.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
          }`}>
            {notification.message}
          </div>
        )}

        <div className="max-w-md w-full space-y-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 animate-fade-in">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-4">
                <span className="text-2xl text-white">📋</span>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">TaskFlow Pro</h2>
              <p className="text-gray-600 mb-8">Streamline your team's workflow</p>
            </div>
            
            <div className="space-y-4">
              <button
                onClick={() => handleLogin('admin')}
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Logging in...' : 'Login as Admin'}
              </button>
              
              <button
                onClick={() => handleLogin('staff')}
                disabled={loading}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-medium py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Logging in...' : 'Login as Staff'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100">
      {/* Notification */}
      {notification.show && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 animate-slide-in ${
          notification.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
        }`}>
          {notification.message}
        </div>
      )}

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm font-bold">T</span>
                </div>
                <h1 className="text-xl font-bold text-gray-900">TaskFlow</h1>
              </div>
              
              <div className="flex space-x-1 bg-gray-100/50 p-1 rounded-xl">
                {user.type === 'Admin' && (
                  <button
                    onClick={() => { setActiveTab('admin'); loadAdminData(); }}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                      activeTab === 'admin' 
                        ? 'bg-white text-blue-700 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Admin Dashboard
                  </button>
                )}
                <button
                  onClick={() => { setActiveTab('staff'); loadStaffData(); }}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    activeTab === 'staff' 
                      ? 'bg-white text-green-700 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  My Tasks
                </button>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500 capitalize">{user.type.toLowerCase()}</p>
              </div>
              <button
                onClick={handleLogout}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-all duration-200 transform hover:scale-105 text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Admin Dashboard */}
        {activeTab === 'admin' && user.type === 'Admin' && (
          <div className="space-y-6 animate-fade-in">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-gray-200/50 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-center">
                  <div className="bg-blue-100 p-3 rounded-xl">
                    <span className="text-blue-600 text-2xl">📋</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Total Tasks</p>
                    <p className="text-2xl font-bold text-gray-900">{tasks.length}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-gray-200/50 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-center">
                  <div className="bg-yellow-100 p-3 rounded-xl">
                    <span className="text-yellow-600 text-2xl">⏳</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Pending</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {tasks.filter(t => t.status === 'pending').length}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-gray-200/50 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-center">
                  <div className="bg-green-100 p-3 rounded-xl">
                    <span className="text-green-600 text-2xl">✅</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Completed</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {tasks.filter(t => t.status === 'completed').length}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-gray-200/50 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-center">
                  <div className="bg-red-100 p-3 rounded-xl">
                    <span className="text-red-600 text-2xl">🚨</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Urgent</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {tasks.filter(t => t.priority === 'urgent').length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Header with Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Task Management</h2>
                <p className="text-gray-600">Manage and assign tasks to your team</p>
              </div>
              <button
                onClick={() => setShowAssignModal(true)}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 shadow-sm"
              >
                + Assign New Task
              </button>
            </div>

            {/* Tasks Grid */}
            {loading ? (
              <LoadingSpinner />
            ) : tasks.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📋</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No tasks yet</h3>
                <p className="text-gray-600 mb-6">Get started by assigning your first task to the team</p>
                <button
                  onClick={() => setShowAssignModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200"
                >
                  Create First Task
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {tasks.map((task) => (
                  <div key={task._id} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/50 p-6 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="font-semibold text-lg text-gray-900 line-clamp-2">{task.title}</h3>
                      <PriorityBadge priority={task.priority} />
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">{task.description}</p>
                    
                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Assigned to:</span>
                        <span className="font-medium text-gray-900">{task.assignedTo?.name || 'Unassigned'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Due Date:</span>
                        <span className="font-medium text-gray-900">
                          {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm items-center">
                        <span className="text-gray-500">Status:</span>
                        <StatusBadge status={task.status} />
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-medium text-gray-900">{task.progress}%</span>
                      </div>
                      <ProgressBar progress={task.progress} />
                    </div>

                    {/* Tags */}
                    {task.tags && task.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {task.tags.map((tag, index) => (
                          <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 rounded-lg text-xs">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Staff Dashboard - Each staff sees ONLY their tasks */}
        {activeTab === 'staff' && (
          <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">My Tasks</h2>
                <p className="text-gray-600">Manage your assigned tasks and track progress</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-500 bg-white/50 px-4 py-2 rounded-xl">
                  <span className="font-semibold text-gray-900">
                    {tasks.filter(t => t.status !== 'completed').length}
                  </span> pending tasks
                </div>
                <button
                  onClick={loadStaffData}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-all duration-200 text-sm"
                >
                  Refresh
                </button>
              </div>
            </div>

            {/* Tasks List */}
            {loading ? (
              <LoadingSpinner />
            ) : tasks.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🎯</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No tasks assigned</h3>
                <p className="text-gray-600">You're all caught up! New tasks will appear here when assigned.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {tasks.map((task) => (
                  <div key={task._id} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/50 p-6 hover:shadow-md transition-all duration-300">
                    <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 mb-4">
                      <div className="flex-1">
                        <div className="flex items-start gap-3 mb-2">
                          <h3 className="font-semibold text-lg text-gray-900">{task.title}</h3>
                          <div className="flex gap-2">
                            <StatusBadge status={task.status} />
                            <PriorityBadge priority={task.priority} />
                          </div>
                        </div>
                        <p className="text-gray-600 text-sm">{task.description}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div className="text-sm">
                        <span className="text-gray-500">Due Date: </span>
                        <span className="font-medium text-gray-900">
                          {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
                        </span>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-500">Assigned by: </span>
                        <span className="font-medium text-gray-900">{task.assignedBy?.name || 'Admin'}</span>
                      </div>
                    </div>

                    {/* Progress Section */}
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-600">Current Progress</span>
                          <span className="font-medium text-gray-900">{task.progress}%</span>
                        </div>
                        <ProgressBar progress={task.progress} size="lg" />
                      </div>

                      {/* Quick Progress Controls */}
                      <div className="flex flex-wrap gap-2">
                        {[0, 25, 50, 75, 100].map((value) => (
                          <button
                            key={value}
                            onClick={() => handleUpdateProgress(task._id, value)}
                            disabled={loading}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex-1 min-w-[60px] ${
                              task.progress === value
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            {value}%
                          </button>
                        ))}
                      </div>

                      {/* Action Controls */}
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleUpdateStatus(task._id, 'in-progress')}
                          disabled={loading || task.status === 'in-progress' || task.status === 'completed'}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex-1 ${
                            task.status === 'in-progress'
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          Start Work
                        </button>
                        <button
                          onClick={() => handleUpdateProgress(task._id, 100)}
                          disabled={loading || task.status === 'completed'}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex-1 ${
                            task.status === 'completed'
                              ? 'bg-green-600 text-white shadow-sm'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          Mark Complete
                        </button>
                        <button
                          onClick={() => {
                            setSelectedTaskForComment(task._id);
                            setShowCommentModal(true);
                          }}
                          className="px-4 py-2 rounded-lg text-sm font-medium bg-purple-100 text-purple-700 hover:bg-purple-200 transition-all duration-200 flex-1"
                        >
                          Add Comment
                        </button>
                      </div>

                      {/* Comments Section */}
                      {task.comments && task.comments.length > 0 && (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Comments:</h4>
                          <div className="space-y-2 max-h-32 overflow-y-auto">
                            {task.comments.slice(-3).map((comment, index) => (
                              <div key={index} className="bg-gray-50 rounded-lg p-3 text-sm">
                                <div className="flex justify-between items-start mb-1">
                                  <span className="font-medium text-gray-900">
                                    {comment.user?.name || 'User'}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {new Date(comment.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="text-gray-700">{comment.comment}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Assign Task Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform animate-scale-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Assign New Task</h3>
              <button
                onClick={() => setShowAssignModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAssignTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  value={assignForm.title}
                  onChange={(e) => setAssignForm({...assignForm, title: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter task title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  required
                  value={assignForm.description}
                  onChange={(e) => setAssignForm({...assignForm, description: e.target.value})}
                  rows="3"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                  placeholder="Enter task description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assign To *
                </label>
                <select
                  required
                  value={assignForm.assignedTo}
                  onChange={(e) => setAssignForm({...assignForm, assignedTo: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="">Select staff member</option>
                  {staffList.map((staff) => (
                    <option key={staff._id} value={staff._id}>
                      {staff.name} ({staff.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <select
                    value={assignForm.priority}
                    onChange={(e) => setAssignForm({...assignForm, priority: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Due Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={assignForm.dueDate}
                    onChange={(e) => setAssignForm({...assignForm, dueDate: e.target.value})}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={assignForm.tags}
                  onChange={(e) => setAssignForm({...assignForm, tags: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="design, frontend, urgent"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 px-4 rounded-xl font-medium transition-all duration-200 transform hover:scale-105"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Assigning...' : 'Assign Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Comment Modal */}
      {showCommentModal && (
        <CommentModal
          taskId={selectedTaskForComment}
          onClose={() => {
            setShowCommentModal(false);
            setSelectedTaskForComment(null);
          }}
          onSubmit={handleAddComment}
        />
      )}
    </div>
  );
}