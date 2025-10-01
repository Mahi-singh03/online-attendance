// components/StaffDashboard.js
"use client"
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const StaffDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [attendanceData, setAttendanceData] = useState([]);
  const [taskStats, setTaskStats] = useState(null);
  const [assignedTasks, setAssignedTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  // Fetch all data
  useEffect(() => {
    fetchDashboardData();
  }, [dateRange]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch attendance data
      const attendanceRes = await fetch(
        `/api/staff-attendance/simple?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`
      );
      const attendanceJson = await attendanceRes.json();
      if (attendanceJson.success) {
        setAttendanceData(attendanceJson.data);
      }

      // Fetch task completion stats for last week
      const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const statsRes = await fetch(
        `/api/tasks/completion-stats?startDate=${lastWeek.toISOString().split('T')[0]}`
      );
      const statsJson = await statsRes.json();
      if (statsJson.success) {
        setTaskStats(statsJson.data);
      }

      // Fetch assigned tasks (you'll need to create this API endpoint)
      const tasksRes = await fetch('/api/tasks/assigned');
      const tasksJson = await tasksRes.json();
      if (tasksJson.success) {
        setAssignedTasks(tasksJson.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5
      }
    }
  };

  const cardVariants = {
    hidden: { scale: 0.9, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24
      }
    },
    hover: {
      scale: 1.02,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-6">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <motion.header variants={itemVariants} className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
            Staff Dashboard
          </h1>
          <p className="text-gray-600">Comprehensive overview of staff performance and attendance</p>
        </motion.header>

        {/* Date Range Selector */}
        <motion.div variants={itemVariants} className="mb-6 bg-white rounded-xl p-4 shadow-lg">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <label className="text-sm font-medium text-gray-700">Date Range:</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={fetchDashboardData}
              className="ml-auto px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
            >
              Apply
            </button>
          </div>
        </motion.div>

        {/* Navigation Tabs */}
        <motion.nav variants={itemVariants} className="mb-6">
          <div className="flex space-x-1 bg-white/80 backdrop-blur-sm rounded-xl p-1 shadow-lg">
            {['overview', 'attendance', 'tasks', 'assigned'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 px-4 text-sm font-medium rounded-lg transition-all duration-200 ${
                  activeTab === tab
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </motion.nav>

        {/* Content Area */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <OverviewTab 
                taskStats={taskStats} 
                attendanceData={attendanceData}
                assignedTasks={assignedTasks}
                variants={containerVariants}
                cardVariants={cardVariants}
                itemVariants={itemVariants}
              />
            )}
            {activeTab === 'attendance' && (
              <AttendanceTab 
                attendanceData={attendanceData}
                variants={containerVariants}
                itemVariants={itemVariants}
              />
            )}
            {activeTab === 'tasks' && (
              <TasksTab 
                taskStats={taskStats}
                variants={containerVariants}
                itemVariants={itemVariants}
              />
            )}
            {activeTab === 'assigned' && (
              <AssignedTab 
                assignedTasks={assignedTasks}
                variants={containerVariants}
                itemVariants={itemVariants}
              />
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

// Overview Tab Component
const OverviewTab = ({ taskStats, attendanceData, assignedTasks, variants, cardVariants, itemVariants }) => (
  <motion.div
    key="overview"
    initial="hidden"
    animate="visible"
    exit="hidden"
    variants={variants}
    className="space-y-6"
  >
    {/* Stats Grid */}
    <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="Total Tasks"
        value={taskStats?.totalTasks || 0}
        icon="📊"
        color="blue"
        variants={cardVariants}
      />
      <StatCard
        title="Completed"
        value={taskStats?.completedTasks || 0}
        icon="✅"
        color="green"
        variants={cardVariants}
      />
      <StatCard
        title="Completion Rate"
        value={`${taskStats?.completionRate || 0}%`}
        icon="📈"
        color="purple"
        variants={cardVariants}
      />
      <StatCard
        title="Attendance Records"
        value={attendanceData.length}
        icon="👥"
        color="orange"
        variants={cardVariants}
      />
    </motion.div>

    {/* Progress Bars */}
    <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ProgressCard 
        title="Task Progress"
        stats={taskStats}
        variants={cardVariants}
      />
      <RecentActivity 
        attendanceData={attendanceData}
        assignedTasks={assignedTasks}
        variants={cardVariants}
      />
    </motion.div>
  </motion.div>
);

// Stat Card Component
const StatCard = ({ title, value, icon, color, variants }) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600'
  };

  return (
    <motion.div
      variants={variants}
      whileHover="hover"
      className={`bg-gradient-to-br ${colorClasses[color]} text-white rounded-2xl p-6 shadow-lg`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/80 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </motion.div>
  );
};

// Progress Card Component
const ProgressCard = ({ title, stats, variants }) => (
  <motion.div
    variants={variants}
    className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
  >
    <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
    <div className="space-y-4">
      <ProgressBar label="Completed" value={stats?.completedTasks || 0} total={stats?.totalTasks || 1} color="green" />
      <ProgressBar label="In Progress" value={stats?.inProgressTasks || 0} total={stats?.totalTasks || 1} color="blue" />
      <ProgressBar label="Pending" value={stats?.pendingTasks || 0} total={stats?.totalTasks || 1} color="yellow" />
      <ProgressBar label="Overdue" value={stats?.overdueTasks || 0} total={stats?.totalTasks || 1} color="red" />
    </div>
  </motion.div>
);

// Progress Bar Component
const ProgressBar = ({ label, value, total, color }) => {
  const percentage = (value / total) * 100;
  const colorClasses = {
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500'
  };

  return (
    <div>
      <div className="flex justify-between text-sm text-gray-600 mb-1">
        <span>{label}</span>
        <span>{value} / {total}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`h-3 rounded-full ${colorClasses[color]} transition-all duration-300`}
        />
      </div>
    </div>
  );
};

// Recent Activity Component
const RecentActivity = ({ attendanceData, assignedTasks, variants }) => (
  <motion.div
    variants={variants}
    className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
  >
    <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h3>
    <div className="space-y-3 max-h-64 overflow-y-auto">
      {attendanceData.slice(0, 5).map((record, index) => (
        <motion.div
          key={record.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors duration-200"
        >
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-800">{record.staffName}</p>
            <p className="text-xs text-gray-500">
              Logged in: {new Date(record.loginTime).toLocaleString()}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  </motion.div>
);

// Attendance Tab Component
const AttendanceTab = ({ attendanceData, variants, itemVariants }) => (
  <motion.div
    key="attendance"
    initial="hidden"
    animate="visible"
    exit="hidden"
    variants={variants}
  >
    <motion.h3 variants={itemVariants} className="text-xl font-semibold text-gray-800 mb-6">
      Attendance History ({attendanceData.length} records)
    </motion.h3>
    <div className="overflow-hidden rounded-2xl border border-gray-200">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Staff Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Login Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Logout Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Duration
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {attendanceData.map((record, index) => (
              <motion.tr
                key={record.id}
                variants={itemVariants}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                className="hover:bg-gray-50 transition-colors duration-200"
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {record.staffName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(record.loginTime).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {record.logoutTime ? new Date(record.logoutTime).toLocaleString() : 'Still logged in'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {record.logoutTime ? 
                    `${Math.round((new Date(record.logoutTime) - new Date(record.loginTime)) / (1000 * 60 * 60))}h` : 
                    'Active'
                  }
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </motion.div>
);

// Tasks Tab Component
const TasksTab = ({ taskStats, variants, itemVariants }) => (
  <motion.div
    key="tasks"
    initial="hidden"
    animate="visible"
    exit="hidden"
    variants={variants}
    className="space-y-6"
  >
    <motion.h3 variants={itemVariants} className="text-xl font-semibold text-gray-800">
      Task Completion Statistics (Last 7 Days)
    </motion.h3>
    
    {taskStats && (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <motion.div
          variants={itemVariants}
          className="bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-2xl p-6 text-center shadow-lg"
        >
          <div className="text-4xl font-bold mb-2">{taskStats.completionRate}%</div>
          <div className="text-white/80">Completion Rate</div>
        </motion.div>
        
        <motion.div variants={itemVariants} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <h4 className="font-semibold text-gray-800 mb-4">Task Distribution</h4>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-green-600">Completed</span>
              <span>{taskStats.completedTasks}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-blue-600">In Progress</span>
              <span>{taskStats.inProgressTasks}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-yellow-600">Pending</span>
              <span>{taskStats.pendingTasks}</span>
            </div>
          </div>
        </motion.div>
        
        <motion.div variants={itemVariants} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <h4 className="font-semibold text-gray-800 mb-4">Performance</h4>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Total Tasks</span>
              <span className="font-medium">{taskStats.totalTasks}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-red-600">Overdue</span>
              <span>{taskStats.overdueTasks}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Success Rate</span>
              <span className="font-medium text-green-600">{taskStats.completionRate}%</span>
            </div>
          </div>
        </motion.div>
      </div>
    )}
  </motion.div>
);

// Assigned Tasks Tab Component
const AssignedTab = ({ assignedTasks, variants, itemVariants }) => (
  <motion.div
    key="assigned"
    initial="hidden"
    animate="visible"
    exit="hidden"
    variants={variants}
  >
    <motion.h3 variants={itemVariants} className="text-xl font-semibold text-gray-800 mb-6">
      Assigned Tasks ({assignedTasks.length})
    </motion.h3>
    
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {assignedTasks.map((task, index) => (
        <motion.div
          key={task._id}
          variants={itemVariants}
          whileHover={{ scale: 1.02 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300"
        >
          <div className="flex items-start justify-between mb-3">
            <h4 className="font-semibold text-gray-800 line-clamp-2">{task.title}</h4>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              task.priority === 'high' ? 'bg-red-100 text-red-800' :
              task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
              'bg-green-100 text-green-800'
            }`}>
              {task.priority}
            </span>
          </div>
          
          <p className="text-gray-600 text-sm mb-4 line-clamp-3">{task.description}</p>
          
          <div className="space-y-2 text-sm text-gray-500">
            <div className="flex justify-between">
              <span>Status:</span>
              <span className={`font-medium ${
                task.status === 'completed' ? 'text-green-600' :
                task.status === 'in-progress' ? 'text-blue-600' :
                'text-yellow-600'
              }`}>
                {task.status}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Due Date:</span>
              <span className="font-medium">{new Date(task.dueDate).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Assigned To:</span>
              <span className="font-medium">{task.assignedTo?.name || 'Unassigned'}</span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  </motion.div>
);

export default StaffDashboard;