// app/staff/page.jsx
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Users, 
  Search, 
  Edit, 
  Trash2, 
  Network,
  Shield,
  UserPlus,
  AlertCircle,
  CheckCircle,
  X
} from 'lucide-react';

export default function StaffManagement() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showNetworkModal, setShowNetworkModal] = useState(false);
  const [networkInfo, setNetworkInfo] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [alert, setAlert] = useState({ show: false, message: '', type: '' });

  useEffect(() => {
    fetchStaff();
    fetchNetworkInfo();
  }, []);

  const showAlert = (message, type = 'success') => {
    setAlert({ show: true, message, type });
    setTimeout(() => setAlert({ show: false, message: '', type: '' }), 4000);
  };

  const fetchStaff = async () => {
    try {
      const response = await fetch('/api/admin/staff');
      const data = await response.json();
      if (data.success) {
        setStaff(data.data);
      } else {
        showAlert(data.error || 'Error fetching staff', 'error');
      }
    } catch (error) {
      console.error('Error fetching staff:', error);
      showAlert('Error fetching staff', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchNetworkInfo = async () => {
    try {
      const response = await fetch('/api/admin/network-info');
      const data = await response.json();
      if (data.success) {
        setNetworkInfo(data.data);
      }
    } catch (error) {
      console.error('Error fetching network info:', error);
    }
  };

  const filteredStaff = staff.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      {/* Alert Notification */}
      <AnimatePresence>
        {alert.show && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
              alert.type === 'error' ? 'bg-red-500' : 'bg-green-500'
            } text-white`}
          >
            <div className="flex items-center space-x-2">
              {alert.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
              <span>{alert.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Staff Management</h1>
          <p className="text-gray-600">Manage your team members and their network access</p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            icon={<Users className="text-blue-500" />}
            title="Total Staff"
            value={staff.length}
            color="blue"
          />
          <StatCard
            icon={<Shield className="text-green-500" />}
            title="IP Restricted"
            value={staff.filter(m => m.allowedIps?.length > 0).length}
            color="green"
          />
          <StatCard
            icon={<Network className="text-purple-500" />}
            title="Current Network"
            value={networkInfo?.clientIP || 'Loading...'}
            color="purple"
          />
        </div>

        {/* Action Bar */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-lg p-6 mb-6"
        >
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search staff by name or email..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex space-x-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setLoading(true);
                  fetchStaff();
                }}
                className="flex items-center space-x-2 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                disabled={loading}
              >
                <motion.div
                  animate={loading ? { rotate: 360 } : {}}
                  transition={{ duration: 1, repeat: loading ? Infinity : 0, ease: "linear" }}
                >
                  <Users size={20} />
                </motion.div>
                <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowNetworkModal(true)}
                className="flex items-center space-x-2 bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors"
              >
                <Network size={20} />
                <span>Network Info</span>
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAddModal(true)}
                className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                <UserPlus size={20} />
                <span>Add Staff</span>
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Staff List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-lg overflow-hidden"
        >
          {filteredStaff.length === 0 ? (
            <div className="text-center py-12">
              <Users size={64} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 text-lg">No staff members found</p>
            </div>
          ) : (
            <div className="grid gap-4 p-4">
              {filteredStaff.map((member, index) => (
                <StaffCard
                  key={member._id}
                  member={member}
                  index={index}
                  onUpdate={fetchStaff}
                  onError={(message) => showAlert(message, 'error')}
                  onSuccess={(message) => showAlert(message, 'success')}
                />
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showAddModal && (
          <AddStaffModal
            onClose={() => setShowAddModal(false)}
            onSuccess={() => {
              fetchStaff();
              setShowAddModal(false);
              showAlert('Staff member added successfully!');
            }}
            networkInfo={networkInfo}
          />
        )}
        
        {showNetworkModal && (
          <NetworkInfoModal
            networkInfo={networkInfo}
            onClose={() => setShowNetworkModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Stat Card Component
const StatCard = ({ icon, title, value, color }) => (
  <motion.div
    whileHover={{ scale: 1.05, y: -5 }}
    className={`bg-white rounded-xl shadow-lg p-6 border-l-4 border-${color}-500`}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-600 text-sm font-medium">{title}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
      </div>
      <div className="p-3 bg-gray-100 rounded-full">
        {icon}
      </div>
    </div>
  </motion.div>
);

// Staff Card Component
const StaffCard = ({ member, index, onUpdate, onError, onSuccess }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(member);

  const handleUpdate = async () => {
    try {
      // Normalize allowedIps: backend accepts string (comma-separated) or empty
      const allowedIpsValue = Array.isArray(editData.allowedIps)
        ? editData.allowedIps.join(',')
        : (editData.allowedIps || '');

      const response = await fetch(`/api/admin/staff/${member._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editData.name,
          email: editData.email,
          // password update optional: only send if provided
          ...(editData.password ? { password: editData.password } : {}),
          allowedIps: allowedIpsValue,
        }),
      });
      
      const data = await response.json();
      if (data.success) {
        onSuccess('Staff member updated successfully!');
        setIsEditing(false);
        onUpdate();
      } else {
        onError(data.error);
      }
    } catch (error) {
      onError('Error updating staff member');
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${member.name}"?\n\nThis action cannot be undone and will remove all their attendance records.`
    );
    
    if (!confirmed) return;
    
    try {
      const response = await fetch(`/api/admin/staff/${member._id}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      if (data.success) {
        onSuccess(`Staff member "${member.name}" deleted successfully!`);
        onUpdate();
      } else {
        onError(data.error || 'Failed to delete staff member');
      }
    } catch (error) {
      console.error('Delete error:', error);
      onError('Error deleting staff member');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow"
    >
      {!isEditing ? (
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-800 text-lg">{member.name}</h3>
            <p className="text-gray-600 text-sm mb-2">{member.email}</p>
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <div className="flex items-center space-x-1">
                <Shield size={14} className="text-green-500" />
                <span>{member.allowedIps?.length || 0} allowed IP(s)</span>
              </div>
              <div className="flex items-center space-x-1">
                <Network size={14} className="text-blue-500" />
                <span>Created: {new Date(member.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            {member.allowedIps && member.allowedIps.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-gray-500 mb-1">Allowed IPs:</p>
                <div className="flex flex-wrap gap-1">
                  {member.allowedIps.slice(0, 3).map((ip, index) => (
                    <span key={index} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                      {ip}
                    </span>
                  ))}
                  {member.allowedIps.length > 3 && (
                    <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                      +{member.allowedIps.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="flex space-x-2 ml-4">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsEditing(true)}
              className="p-2 text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
              title="Edit staff member"
            >
              <Edit size={16} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleDelete}
              className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
              title="Delete staff member"
            >
              <Trash2 size={16} />
            </motion.button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
            <input
              type="text"
              value={editData.name}
              onChange={(e) => setEditData({ ...editData, name: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
            <input
              type="email"
              value={editData.email}
              onChange={(e) => setEditData({ ...editData, email: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Password (leave blank to keep current)</label>
            <input
              type="password"
              value={editData.password || ''}
              onChange={(e) => setEditData({ ...editData, password: e.target.value })}
              placeholder="Enter new password (optional)"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Allowed IPs (comma-separated)</label>
            <textarea
              placeholder="192.168.1.1, 10.0.0.0/24, 192.168.1.*"
              value={editData.allowedIps?.join(', ') || ''}
              onChange={(e) => setEditData({ ...editData, allowedIps: e.target.value.split(',').map(ip => ip.trim()).filter(ip => ip) })}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              rows={2}
            />
            <p className="text-xs text-gray-500 mt-1">
              Supports individual IPs, CIDR notation (192.168.1.0/24), and wildcards (192.168.1.*)
            </p>
          </div>
          <div className="flex space-x-2 pt-2">
            <button
              onClick={handleUpdate}
              className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition-colors"
            >
              Save Changes
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setEditData(member);
              }}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg text-sm hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

// Add Staff Modal
const AddStaffModal = ({ onClose, onSuccess, networkInfo }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    allowedIps: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setErrors({});

    try {
      const response = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          // Send only admin-specified additional IPs; backend auto-detects and includes current network IP
          allowedIps: formData.allowedIps
        }),
      });

      const data = await response.json();
      if (data.success) {
        onSuccess();
      } else {
        setErrors({ general: data.error });
      }
    } catch (error) {
      setErrors({ general: 'Error creating staff member' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-xl shadow-2xl max-w-md w-full"
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">Add New Staff</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {errors.general && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {errors.general}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.password ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Allowed IPs (comma-separated)
              </label>
              <textarea
                value={formData.allowedIps}
                onChange={(e) => setFormData({ ...formData, allowedIps: e.target.value })}
                placeholder={`Current network IP (${networkInfo?.clientIP}) will be automatically included`}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave empty to only allow access from current network ({networkInfo?.clientIP}). 
                Supports individual IPs, CIDR notation (192.168.1.0/24), and wildcards (192.168.1.*)
              </p>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                {loading ? 'Adding...' : 'Add Staff'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Network Info Modal
const NetworkInfoModal = ({ networkInfo, onClose }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
  >
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      className="bg-white rounded-xl shadow-2xl max-w-md w-full"
    >
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Network Information</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        {networkInfo ? (
          <div className="space-y-3">
            <InfoRow label="Your IP Address" value={networkInfo.clientIP} />
            <InfoRow label="User Agent" value={networkInfo.userAgent} />
            <InfoRow label="X-Forwarded-For" value={networkInfo.forwardedFor} />
            <InfoRow label="X-Real-IP" value={networkInfo.realIP} />
            <InfoRow label="Cloudflare IP" value={networkInfo.cfConnectingIP} />
            <InfoRow label="Timestamp" value={new Date(networkInfo.timestamp).toLocaleString()} />
          </div>
        ) : (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          </div>
        )}
      </div>
    </motion.div>
  </motion.div>
);

const InfoRow = ({ label, value }) => (
  <div>
    <dt className="text-sm font-medium text-gray-500">{label}</dt>
    <dd className="text-sm text-gray-900 break-all">{value || 'Not available'}</dd>
  </div>
);

const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full"
    />
  </div>
);