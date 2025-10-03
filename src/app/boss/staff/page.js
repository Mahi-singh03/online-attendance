// app/staff/page.jsx
'use client';

import { useState, useEffect, useRef } from 'react';
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
  X,
  Camera,
  Upload,
  User,
  Mail,
  Key,
  Globe,
  Save,
  RotateCcw
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
      setLoading(true);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4">
      {/* Alert Notification */}
      <AnimatePresence>
        {alert.show && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            className={`fixed top-4 right-4 p-4 rounded-xl shadow-lg z-50 max-w-sm ${
              alert.type === 'error' 
                ? 'bg-red-500 border-l-4 border-red-600' 
                : 'bg-green-500 border-l-4 border-green-600'
            } text-white`}
          >
            <div className="flex items-center space-x-3">
              {alert.type === 'error' ? 
                <AlertCircle size={24} className="flex-shrink-0" /> : 
                <CheckCircle size={24} className="flex-shrink-0" />
              }
              <span className="text-sm font-medium">{alert.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
            Staff Management
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Manage your team members, profile photos, and network access controls
          </p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <StatCard
            icon={<Users className="text-blue-600" />}
            title="Total Staff"
            value={staff.length}
            color="blue"
            delay={0}
          />
          <StatCard
            icon={<Shield className="text-green-600" />}
            title="IP Restricted"
            value={staff.filter(m => m.allowedIps?.length > 0).length}
            color="green"
            delay={0.1}
          />
          <StatCard
            icon={<Network className="text-purple-600" />}
            title="Current Network"
            value={networkInfo?.clientIP || 'Loading...'}
            color="purple"
            delay={0.2}
          />
        </motion.div>

        {/* Action Bar */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 mb-6 border border-white/20"
        >
          <div className="flex flex-col lg:flex-row justify-between items-center space-y-4 lg:space-y-0">
            <div className="relative flex-1 max-w-lg w-full">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search staff by name or email..."
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-300"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex flex-wrap gap-3 justify-center">
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={fetchStaff}
                disabled={loading}
                className="flex items-center space-x-2 bg-gradient-to-r from-gray-600 to-gray-700 text-white px-5 py-3 rounded-xl hover:shadow-lg transition-all duration-300 disabled:opacity-50"
              >
                <motion.div
                  animate={loading ? { rotate: 360 } : {}}
                  transition={{ duration: 1, repeat: loading ? Infinity : 0, ease: "linear" }}
                >
                  <RotateCcw size={20} />
                </motion.div>
                <span className="font-medium">{loading ? 'Refreshing...' : 'Refresh'}</span>
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowNetworkModal(true)}
                className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white px-5 py-3 rounded-xl hover:shadow-lg transition-all duration-300"
              >
                <Network size={20} />
                <span className="font-medium">Network Info</span>
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAddModal(true)}
                className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-3 rounded-xl hover:shadow-lg transition-all duration-300"
              >
                <UserPlus size={20} />
                <span className="font-medium">Add Staff</span>
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Staff List */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-white/20"
        >
          {filteredStaff.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16"
            >
              <Users size={80} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 text-xl font-medium mb-2">No staff members found</p>
              <p className="text-gray-400 mb-6">Try adjusting your search or add new staff members</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAddModal(true)}
                className="bg-blue-500 text-white px-6 py-3 rounded-xl hover:bg-blue-600 transition-colors"
              >
                Add Your First Staff Member
              </motion.button>
            </motion.div>
          ) : (
            <div className="grid gap-4 p-6">
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
            onError={(message) => showAlert(message, 'error')}
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
const StatCard = ({ icon, title, value, color, delay }) => {
  const colorMap = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay }}
      whileHover={{ scale: 1.05, y: -5 }}
      className={`bg-gradient-to-br ${colorMap[color]} text-white rounded-2xl shadow-lg p-6 relative overflow-hidden`}
    >
      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-100 text-sm font-medium">{title}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
          </div>
          <motion.div 
            className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm"
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.5 }}
          >
            {icon}
          </motion.div>
        </div>
      </div>
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
    </motion.div>
  );
};

// Staff Card Component
const StaffCard = ({ member, index, onUpdate, onError, onSuccess }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: '',
    email: '',
    password: '',
    allowedIps: ''
  });
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [hoverPreview, setHoverPreview] = useState(null);
  const fileInputRef = useRef(null);
  const nameInputRef = useRef(null);

  // Initialize edit data when member changes or when entering edit mode
  useEffect(() => {
    if (isEditing) {
      setEditData({
        name: member.name || '',
        email: member.email || '',
        password: '',
        allowedIps: Array.isArray(member.allowedIps) ? member.allowedIps.join(', ') : (member.allowedIps || '')
      });
    }
  }, [member, isEditing]);

  // Focus name input when editing starts
  useEffect(() => {
    if (isEditing && nameInputRef.current) {
      nameInputRef.current.focus();
      if (typeof nameInputRef.current.select === 'function') {
        nameInputRef.current.select();
      }
    }
  }, [isEditing]);

  const handlePhotoUpload = async (file) => {
    if (!file) return;
    
    setUploadingPhoto(true);
    const formData = new FormData();
    formData.append('profilePhoto', file);

    try {
      const response = await fetch(`/api/admin/staff/${member._id}`, {
        method: 'PUT',
        body: formData,
      });
      
      const data = await response.json();
      if (data.success) {
        onSuccess('Profile photo updated successfully!');
        onUpdate();
      } else {
        onError(data.error || 'Failed to upload photo');
      }
    } catch (error) {
      onError('Error uploading photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = async () => {
    const formData = new FormData();
    formData.append('removePhoto', 'true');

    try {
      const response = await fetch(`/api/admin/staff/${member._id}`, {
        method: 'PUT',
        body: formData,
      });
      
      const data = await response.json();
      if (data.success) {
        onSuccess('Profile photo removed successfully!');
        onUpdate();
      } else {
        onError(data.error || 'Failed to remove photo');
      }
    } catch (error) {
      onError('Error removing photo');
    }
  };

  const handleUpdate = async () => {
    try {
      const formData = new FormData();
      
      // Only include fields that have changed
      if (editData.name !== member.name) {
        formData.append('name', editData.name);
      }
      if (editData.email !== member.email) {
        formData.append('email', editData.email);
      }
      if (editData.password) {
        formData.append('password', editData.password);
      }
      
      // Only send allowedIps if it's different from current
      const currentIpsString = Array.isArray(member.allowedIps) ? member.allowedIps.join(', ') : (member.allowedIps || '');
      if (editData.allowedIps !== currentIpsString) {
        formData.append('allowedIps', editData.allowedIps);
      }

      const response = await fetch(`/api/admin/staff/${member._id}`, {
        method: 'PUT',
        body: formData,
      });
      
      const data = await response.json();
      if (data.success) {
        onSuccess('Staff member updated successfully!');
        setIsEditing(false);
        onUpdate();
      } else {
        onError(data.error || 'Failed to update staff member');
      }
    } catch (error) {
      console.error('Update error:', error);
      onError('Error updating staff member');
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${member.name}"?\n\nThis action cannot be undone and will remove all their data.`
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
      onError('Error deleting staff member');
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditData({
      name: '',
      email: '',
      password: '',
      allowedIps: ''
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ delay: index * 0.1 }}
      whileHover={!isEditing ? { y: -2, scale: 1.02 } : {}}
      className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100"
    >
      {!isEditing ? (
        // View Mode
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="flex items-start space-x-4 flex-1">
            {/* Profile Photo */}
            <div className="relative group">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center overflow-hidden">
                {member.profilePhoto?.url ? (
                  <img 
                    src={member.profilePhoto.url} 
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="text-gray-400" size={24} />
                )}
              </div>
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-2xl transition-all duration-300 flex items-center justify-center overflow-hidden">
                {hoverPreview && (
                  <img
                    src={hoverPreview}
                    alt="Preview"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files && e.target.files[0];
                    if (!file) return;
                    const url = URL.createObjectURL(file);
                    setHoverPreview(url);
                    handlePhotoUpload(file).finally(() => {
                      setTimeout(() => {
                        setHoverPreview(null);
                        URL.revokeObjectURL(url);
                      }, 600);
                    });
                  }}
                />
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => fileInputRef.current?.click()}
                  className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 p-1.5 rounded-full"
                  disabled={uploadingPhoto}
                >
                  {uploadingPhoto ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <RotateCcw size={14} className="text-blue-600" />
                    </motion.div>
                  ) : (
                    <Camera size={14} className="text-blue-600" />
                  )}
                </motion.button>
              </div>
            </div>

            {/* Staff Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-800 text-lg truncate">{member.name}</h3>
              <p className="text-gray-600 text-sm mb-3 flex items-center">
                <Mail size={14} className="mr-1" />
                {member.email}
              </p>
              
              <div className="flex flex-wrap gap-4 text-xs text-gray-500">
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
                <div className="mt-3">
                  <p className="text-xs text-gray-500 mb-2 flex items-center">
                    <Globe size={12} className="mr-1" />
                    Allowed IPs:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {member.allowedIps.slice(0, 3).map((ip, idx) => (
                      <span key={idx} className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-lg font-medium">
                        {ip}
                      </span>
                    ))}
                    {member.allowedIps.length > 3 && (
                      <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-lg">
                        +{member.allowedIps.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsEditing(true)}
              className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-xl hover:bg-blue-600 transition-colors text-sm"
            >
              <Edit size={16} />
              <span>Edit</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleDelete}
              className="flex items-center space-x-2 bg-red-500 text-white px-4 py-2 rounded-xl hover:bg-red-600 transition-colors text-sm"
            >
              <Trash2 size={16} />
              <span>Delete</span>
            </motion.button>
          </div>
        </div>
      ) : (
        // Edit Mode
        <div className="space-y-4">
          {/* Photo Upload in Edit Mode */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center overflow-hidden">
                {member.profilePhoto?.url ? (
                  <img 
                    src={member.profilePhoto.url} 
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="text-gray-400" size={24} />
                )}
              </div>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={(e) => handlePhotoUpload(e.target.files[0])}
              />
              <motion.button
                type="button"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-2 -right-2 bg-blue-500 text-white p-1.5 rounded-full shadow-lg hover:bg-blue-600 transition-colors"
                disabled={uploadingPhoto}
              >
                {uploadingPhoto ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <RotateCcw size={12} />
                  </motion.div>
                ) : (
                  <Camera size={12} />
                )}
              </motion.button>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Profile Photo</p>
              <p className="text-xs text-gray-500">Click camera to upload new photo</p>
              {member.profilePhoto?.url && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="text-xs text-red-500 hover:text-red-700 mt-1"
                >
                  Remove photo
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <User size={16} className="mr-2" />
                Name
              </label>
              <input
                type="text"
                ref={nameInputRef}
                value={editData.name}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Mail size={16} className="mr-2" />
                Email
              </label>
              <input
                type="email"
                value={editData.email}
                onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <Key size={16} className="mr-2" />
              Password (leave blank to keep current)
            </label>
            <input
              type="password"
              value={editData.password}
              onChange={(e) => setEditData({ ...editData, password: e.target.value })}
              placeholder="Enter new password"
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <Globe size={16} className="mr-2" />
              Allowed IPs (comma-separated)
            </label>
            <textarea
              placeholder="192.168.1.1, 10.0.0.0/24, 192.168.1.*"
              value={editData.allowedIps}
              onChange={(e) => setEditData({ ...editData, allowedIps: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
            <p className="text-xs text-gray-500 mt-2">
              Current IPs are preserved. Add new ones or modify existing. Supports individual IPs, CIDR notation, and wildcards.
            </p>
          </div>

          <div className="flex space-x-3 pt-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleUpdate}
              className="flex items-center space-x-2 bg-green-500 text-white px-6 py-3 rounded-xl hover:bg-green-600 transition-colors flex-1"
            >
              <Save size={18} />
              <span>Save Changes</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={cancelEdit}
              className="flex items-center space-x-2 bg-gray-500 text-white px-6 py-3 rounded-xl hover:bg-gray-600 transition-colors flex-1"
            >
              <X size={18} />
              <span>Cancel</span>
            </motion.button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

// Add Staff Modal
const AddStaffModal = ({ onClose, onSuccess, networkInfo, onError }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    allowedIps: '',
    profilePhoto: null
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [photoPreview, setPhotoPreview] = useState(null);
  const fileInputRef = useRef(null);

  const handlePhotoChange = (file) => {
    if (file) {
      setFormData(prev => ({ ...prev, profilePhoto: file }));
      const reader = new FileReader();
      reader.onload = (e) => setPhotoPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    
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
    
    if (!validateForm()) return;
    
    setLoading(true);
    setErrors({});

    try {
      const submitData = new FormData();
      submitData.append('name', formData.name);
      submitData.append('email', formData.email);
      submitData.append('password', formData.password);
      if (formData.allowedIps.trim()) {
        submitData.append('allowedIps', formData.allowedIps);
      }
      if (formData.profilePhoto) {
        submitData.append('profilePhoto', formData.profilePhoto);
      }

      const response = await fetch('/api/admin/staff', {
        method: 'POST',
        body: submitData,
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
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 50 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 50 }}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Add New Staff</h2>
            <motion.button 
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose} 
              className="text-gray-500 hover:text-gray-700 p-1"
            >
              <X size={24} />
            </motion.button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {errors.general && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm"
              >
                {errors.general}
              </motion.div>
            )}

            {/* Photo Upload */}
            <div className="text-center">
              <div className="relative inline-block">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center overflow-hidden mx-auto mb-3">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <User className="text-gray-400" size={32} />
                  )}
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => handlePhotoChange(e.target.files[0])}
                />
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-2 -right-2 bg-blue-500 text-white p-2 rounded-full shadow-lg hover:bg-blue-600 transition-colors"
                >
                  <Camera size={16} />
                </motion.button>
              </div>
              <p className="text-xs text-gray-500">Click camera to upload photo</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <User size={16} className="mr-2" />
                Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                  errors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Mail size={16} className="mr-2" />
                Email
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                  errors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Key size={16} className="mr-2" />
                Password
              </label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                  errors.password ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
              />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Globe size={16} className="mr-2" />
                Allowed IPs (comma-separated)
              </label>
              <textarea
                value={formData.allowedIps}
                onChange={(e) => setFormData({ ...formData, allowedIps: e.target.value })}
                placeholder={`Current network IP (${networkInfo?.clientIP}) will be automatically included`}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                rows={3}
              />
              <p className="text-xs text-gray-500 mt-2">
                Leave empty to only allow access from current network. Supports IPs, CIDR notation, and wildcards.
              </p>
            </div>

            <div className="flex space-x-3 pt-4">
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </motion.button>
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 font-medium"
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                    />
                    <span>Adding...</span>
                  </div>
                ) : (
                  'Add Staff'
                )}
              </motion.button>
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
    onClick={onClose}
  >
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Network Information</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        {networkInfo ? (
          <div className="space-y-4">
            <InfoRow label="Your IP Address" value={networkInfo.clientIP} />
            <InfoRow label="User Agent" value={networkInfo.userAgent} />
            <InfoRow label="X-Forwarded-For" value={networkInfo.forwardedFor} />
            <InfoRow label="X-Real-IP" value={networkInfo.realIP} />
            <InfoRow label="Cloudflare IP" value={networkInfo.cfConnectingIP} />
            <InfoRow label="Timestamp" value={new Date(networkInfo.timestamp).toLocaleString()} />
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          </div>
        )}
      </div>
    </motion.div>
  </motion.div>
);

const InfoRow = ({ label, value }) => (
  <div className="border-b border-gray-100 pb-3 last:border-b-0">
    <dt className="text-sm font-medium text-gray-500 mb-1">{label}</dt>
    <dd className="text-sm text-gray-900 break-all bg-gray-50 p-2 rounded-lg">{value || 'Not available'}</dd>
  </div>
);